using Application.DTOs.Request;
using Application.DTOs.Response;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public class OrdenService : IOrdenService
{
    private readonly IOrdenRepository _ordenRepo;
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly ITecnicoRepository _tecnicoRepo;
    private readonly ICatalogoServicioRepository _catalogoRepo;
    private readonly IPlanRevisionRepository _planRepo;

    public OrdenService(
        IOrdenRepository ordenRepo,
        IVehiculoRepository vehiculoRepo,
        ITecnicoRepository tecnicoRepo,
        ICatalogoServicioRepository catalogoRepo,
        IPlanRevisionRepository planRepo)
    {
        _ordenRepo = ordenRepo;
        _vehiculoRepo = vehiculoRepo;
        _tecnicoRepo = tecnicoRepo;
        _catalogoRepo = catalogoRepo;
        _planRepo = planRepo;
    }

    public async Task<ApiResponse<OrdenResponse>> CrearAsync(CrearOrdenRequest request)
    {
        // Validar que existan vehículo y técnico
        var vehiculo = await _vehiculoRepo.ObtenerPorIdAsync(request.VehiculoId);
        if (vehiculo is null)
            return ApiResponse<OrdenResponse>.Fail("Vehículo no encontrado");

        var tecnico = await _tecnicoRepo.ObtenerPorIdAsync(request.TecnicoId);
        if (tecnico is null)
            return ApiResponse<OrdenResponse>.Fail("Técnico no encontrado");

        // Obtener los servicios seleccionados en una sola consulta
        var servicios = (await _catalogoRepo.ObtenerPorIdsAsync(request.ServiciosIds)).ToList();
        var idsNoEncontrados = request.ServiciosIds.Except(servicios.Select(s => s.Id)).ToList();
        if (idsNoEncontrados.Count > 0)
            return ApiResponse<OrdenResponse>.Fail($"Servicios no encontrados: {string.Join(", ", idsNoEncontrados)}");

        // Parsear prioridad
        if (!Enum.TryParse<Prioridad>(request.Prioridad, true, out var prioridad))
            prioridad = Prioridad.Normal;

        // Crear la orden
        var orden = new OrdenServicio
        {
            VehiculoId = request.VehiculoId,
            TecnicoId = request.TecnicoId,
            ClienteId = request.ClienteId,
            EmpresaId = request.EmpresaId,
            Prioridad = prioridad,
            KmIngreso = request.KmIngreso,
            Observaciones = request.Observaciones,
            EsRevision = request.EsRevision,
            PlanRevisionId = request.PlanRevisionId,
            Detalles = servicios.Select(s => new DetalleOrden
            {
                ServicioId = s.Id,
                Precio = s.PrecioBase
            }).ToList()
        };

        // Si es revisión, validar que el plan no tenga ya una orden activa y marcarlo EnProceso
        if (request.EsRevision && request.PlanRevisionId.HasValue)
        {
            var plan = await _planRepo.ObtenerPorIdConOrigenAsync(request.PlanRevisionId.Value);
            if (plan is null)
                return ApiResponse<OrdenResponse>.Fail("Plan de revisión no encontrado");
            if (plan.Estado == EstadoRevision.EnProceso)
                return ApiResponse<OrdenResponse>.Fail("Ya existe una revisión en proceso para este plan");
            if (plan.Estado == EstadoRevision.Completada)
                return ApiResponse<OrdenResponse>.Fail("Este plan de revisión ya fue completado");

            // La orden de instalación debe estar completada antes de la revisión 1
            if (plan.OrdenOrigen?.Estado != Domain.Enums.EstadoOrden.Completada)
                return ApiResponse<OrdenResponse>.Fail("La orden de instalación aún no está completada");

            // Las revisiones anteriores deben estar completadas
            if (plan.Numero > 1)
            {
                var todosPlanes = await _planRepo.ObtenerPorVehiculoAsync(request.VehiculoId);
                var anterior = todosPlanes.FirstOrDefault(p => p.Numero == plan.Numero - 1);
                if (anterior is null || anterior.Estado != EstadoRevision.Completada)
                    return ApiResponse<OrdenResponse>.Fail($"La revisión {plan.Numero - 1} debe estar completada primero");
            }

            var creada = await _ordenRepo.CrearAsync(orden);

            plan.Estado = EstadoRevision.EnProceso;
            await _planRepo.ActualizarAsync(plan);

            // Si algún servicio genera plan — solo si no tiene plan activo
            var generaPlan = servicios.Any(s => s.GeneraPlanRevision);
            if (generaPlan)
            {
                var planesExistentes = await _planRepo.ObtenerPorVehiculoAsync(request.VehiculoId);
                var tienePlanActivo = planesExistentes.Any(p => p.Estado == EstadoRevision.Pendiente || p.Estado == EstadoRevision.EnProceso);
                if (!tienePlanActivo)
                    await _planRepo.CrearPlanCompletoAsync(request.VehiculoId, creada.Id);
            }

            return ApiResponse<OrdenResponse>.Ok(MapearResponse(creada), "Orden creada exitosamente");
        }

        var ordenCreada = await _ordenRepo.CrearAsync(orden);

        // Si algún servicio genera plan — solo si no tiene plan activo
        var generaPlanNormal = servicios.Any(s => s.GeneraPlanRevision);
        if (generaPlanNormal)
        {
            var planesExistentes = await _planRepo.ObtenerPorVehiculoAsync(request.VehiculoId);
            var tienePlanActivo = planesExistentes.Any(p => p.Estado == EstadoRevision.Pendiente || p.Estado == EstadoRevision.EnProceso);
            if (!tienePlanActivo)
                await _planRepo.CrearPlanCompletoAsync(request.VehiculoId, ordenCreada.Id);
        }

        return ApiResponse<OrdenResponse>.Ok(MapearResponse(ordenCreada), "Orden creada exitosamente");
    }

    public async Task<ApiResponse<OrdenResponse>> ObtenerPorIdAsync(int id)
    {
        var orden = await _ordenRepo.ObtenerPorIdAsync(id);
        if (orden is null)
            return ApiResponse<OrdenResponse>.Fail("Orden no encontrada");

        return ApiResponse<OrdenResponse>.Ok(MapearResponse(orden));
    }

    public async Task<ApiResponse<List<OrdenResponse>>> ObtenerHoyAsync()
    {
        var ordenes = await _ordenRepo.ObtenerPorFechaAsync(DateTime.UtcNow);
        var response = ordenes.Select(MapearResponse).ToList();
        return ApiResponse<List<OrdenResponse>>.Ok(response);
    }

    public async Task<ApiResponse<List<OrdenResponse>>> ObtenerPendientesAsync()
    {
        var ordenes = await _ordenRepo.ObtenerPendientesAsync();
        var response = ordenes.Select(MapearResponse).ToList();
        return ApiResponse<List<OrdenResponse>>.Ok(response);
    }

    public async Task<ApiResponse<OrdenResponse>> ActualizarEstadoAsync(int id, string estado)
    {
        var orden = await _ordenRepo.ObtenerPorIdAsync(id);
        if (orden is null)
            return ApiResponse<OrdenResponse>.Fail("Orden no encontrada");

        if (!Enum.TryParse<EstadoOrden>(estado, true, out var nuevoEstado))
            return ApiResponse<OrdenResponse>.Fail("Estado no válido");

        orden.Estado = nuevoEstado;

        if (nuevoEstado == EstadoOrden.Completada)
            orden.FechaSalida = DateTime.UtcNow;

        var actualizada = await _ordenRepo.ActualizarAsync(orden);
        return ApiResponse<OrdenResponse>.Ok(MapearResponse(actualizada), "Estado actualizado");
    }

    public async Task<ApiResponse<OrdenResponse>> AgregarDetallesAsync(int id, AgregarDetallesRequest request)
    {
        var orden = await _ordenRepo.ObtenerPorIdAsync(id);
        if (orden is null)
            return ApiResponse<OrdenResponse>.Fail("Orden no encontrada");

        if (orden.EsRevision)
            return ApiResponse<OrdenResponse>.Fail("No se pueden agregar servicios a una orden de revisión");

        if (orden.Estado == EstadoOrden.Completada)
            return ApiResponse<OrdenResponse>.Fail("No se pueden agregar servicios a una orden completada");

        var servicios = (await _catalogoRepo.ObtenerPorIdsAsync(request.ServiciosIds)).ToList();
        var idsNoEncontrados = request.ServiciosIds.Except(servicios.Select(s => s.Id)).ToList();
        if (idsNoEncontrados.Count > 0)
            return ApiResponse<OrdenResponse>.Fail($"Servicios no encontrados: {string.Join(", ", idsNoEncontrados)}");

        foreach (var servicio in servicios)
            orden.Detalles.Add(new DetalleOrden { ServicioId = servicio.Id, Precio = servicio.PrecioBase });

        await _ordenRepo.ActualizarAsync(orden);
        return ApiResponse<OrdenResponse>.Ok(MapearResponse(orden), "Servicios agregados");
    }

    public async Task<ApiResponse<OrdenResponse>> EliminarDetalleAsync(int ordenId, int detalleId)
    {
        var orden = await _ordenRepo.ObtenerPorIdAsync(ordenId);
        if (orden is null)
            return ApiResponse<OrdenResponse>.Fail("Orden no encontrada");

        if (orden.Estado == EstadoOrden.Completada)
            return ApiResponse<OrdenResponse>.Fail("No se pueden modificar servicios de una orden completada");

        // Identificar si el servicio a eliminar genera plan de revisión
        var detalle = orden.Detalles.FirstOrDefault(d => d.Id == detalleId);
        if (detalle is null)
            return ApiResponse<OrdenResponse>.Fail("Servicio no encontrado en esta orden");

        var servicioGeneraPlan = detalle.Servicio?.GeneraPlanRevision ?? false;

        var eliminado = await _ordenRepo.EliminarDetalleAsync(ordenId, detalleId);
        if (!eliminado)
            return ApiResponse<OrdenResponse>.Fail("No se pudo eliminar el servicio");

        // Si el servicio eliminado generaba plan, verificar si quedan otros que también lo hagan
        if (servicioGeneraPlan)
        {
            var ordenActualizada = await _ordenRepo.ObtenerPorIdAsync(ordenId);
            var quedaServicioConPlan = ordenActualizada!.Detalles
                .Any(d => d.Servicio?.GeneraPlanRevision == true);

            if (!quedaServicioConPlan)
            {
                // Buscar el plan originado por esta orden
                var planes = (await _planRepo.ObtenerPorOrdenOrigenAsync(ordenId)).ToList();

                // Solo eliminar si TODAS las revisiones siguen pendientes (ninguna se ha completado)
                var todasPendientes = planes.All(p => p.Ficha is null);
                if (planes.Count > 0 && todasPendientes)
                    await _planRepo.EliminarPlanesAsync(planes);
            }
        }

        var ordenFinal = await _ordenRepo.ObtenerPorIdAsync(ordenId);
        return ApiResponse<OrdenResponse>.Ok(MapearResponse(ordenFinal!), "Servicio eliminado");
    }

    private static OrdenResponse MapearResponse(OrdenServicio o) => new()
    {
        Id = o.Id,
        Estado = o.Estado.ToString(),
        Prioridad = o.Prioridad.ToString(),
        KmIngreso = o.KmIngreso,
        Observaciones = o.Observaciones,
        FechaIngreso = o.FechaIngreso,
        FechaSalida = o.FechaSalida,
        Vehiculo = o.Vehiculo is null ? null! : new VehiculoResponse
        {
            Id = o.Vehiculo.Id,
            Placa = o.Vehiculo.Placa,
            Marca = o.Vehiculo.Marca,
            Modelo = o.Vehiculo.Modelo,
            Anio = o.Vehiculo.Anio,
            Color = o.Vehiculo.Color
        },
        Tecnico = o.Tecnico is null ? null! : new TecnicoResponse
        {
            Id = o.Tecnico.Id,
            Nombre = o.Tecnico.Nombre,
            Telefono = o.Tecnico.Telefono
        },
        Cliente = o.Cliente is null ? null! : new ClienteResponse
        {
            Id = o.Cliente.Id,
            Nombre = o.Cliente.Nombre,
            Telefono = o.Cliente.Telefono,
            Email = o.Cliente.Email
        },
        Empresa = o.Empresa is null ? null : new EmpresaResponse
        {
            Id = o.Empresa.Id,
            Nombre = o.Empresa.Nombre,
            Nit = o.Empresa.Nit,
            Email = o.Empresa.Email
        },
        Detalles = o.Detalles?.Select(d => new DetalleOrdenResponse
        {
            Id = d.Id,
            Servicio = d.Servicio?.Nombre ?? string.Empty,
            Precio = d.Precio,
            Notas = d.Notas
        }).ToList() ?? [],
        EsRevision = o.EsRevision,
        PlanRevisionId = o.PlanRevisionId
    };
}