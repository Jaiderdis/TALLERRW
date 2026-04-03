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

        // Obtener los servicios seleccionados
        var servicios = new List<CatalogoServicio>();
        foreach (var servicioId in request.ServiciosIds)
        {
            var servicio = await _catalogoRepo.ObtenerPorIdAsync(servicioId);
            if (servicio is null)
                return ApiResponse<OrdenResponse>.Fail($"Servicio {servicioId} no encontrado");
            servicios.Add(servicio);
        }

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
            Detalles = servicios.Select(s => new DetalleOrden
            {
                ServicioId = s.Id,
                Precio = s.PrecioBase
            }).ToList()
        };

        var creada = await _ordenRepo.CrearAsync(orden);

        // Si algún servicio genera plan — solo si no tiene plan activo
        var generaPlan = servicios.Any(s => s.GeneraPlanRevision);
        if (generaPlan)
        {
            var planesExistentes = await _planRepo.ObtenerPorVehiculoAsync(request.VehiculoId);
            var tienePlanActivo = planesExistentes.Any(p => p.Estado == EstadoRevision.Pendiente);

            if (!tienePlanActivo)
                await _planRepo.CrearPlanCompletoAsync(request.VehiculoId, creada.Id);
            // Si tiene plan activo simplemente no crea otro — la orden queda igual
        }

        return ApiResponse<OrdenResponse>.Ok(MapearResponse(creada), "Orden creada exitosamente");
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
        var ordenes = await _ordenRepo.ObtenerPorFechaAsync(DateTime.Now);
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
        }).ToList() ?? []
    };
}