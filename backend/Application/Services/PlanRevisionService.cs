using Application.DTOs.Request;
using Application.DTOs.Response;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public class PlanRevisionService : IPlanRevisionService
{
    private readonly IPlanRevisionRepository _planRepo;
    private readonly IFichaRevisionRepository _fichaRepo;

    public PlanRevisionService(
        IPlanRevisionRepository planRepo,
        IFichaRevisionRepository fichaRepo)
    {
        _planRepo = planRepo;
        _fichaRepo = fichaRepo;
    }

    public async Task<ApiResponse<List<PlanRevisionResponse>>> ObtenerPorVehiculoAsync(int vehiculoId)
    {
        var planes = await _planRepo.ObtenerPorVehiculoAsync(vehiculoId);
        var response = planes.Select(MapearResponse).ToList();
        return ApiResponse<List<PlanRevisionResponse>>.Ok(response);
    }

    public async Task<ApiResponse<PlanRevisionResponse>> ObtenerSiguienteAsync(int vehiculoId)
    {
        var plan = await _planRepo.ObtenerSiguientePendienteAsync(vehiculoId);
        if (plan is null)
            return ApiResponse<PlanRevisionResponse>.Fail("No hay revisiones pendientes");

        return ApiResponse<PlanRevisionResponse>.Ok(MapearResponse(plan));
    }

    public async Task<ApiResponse<FichaRevisionResponse>> RegistrarFichaAsync(CrearFichaRevisionRequest request)
    {
        var ficha = new FichaRevision
        {
            PlanId = request.PlanId,
            OrdenId = request.OrdenId,
            TecnicoId = request.TecnicoId,
            PresionAlta = request.PresionAlta,
            PresionBaja = request.PresionBaja,
            TempSalida = request.TempSalida,
            GasTipo = request.GasTipo,
            GasCantidad = request.GasCantidad,
            Notas = request.Notas,
            Componentes = request.Componentes.Select(c => new ComponenteRevision
            {
                Componente = c.Componente,
                Estado = Enum.Parse<EstadoComponente>(c.Estado, true),
                Observacion = c.Observacion
            }).ToList()
        };

        var creada = await _fichaRepo.CrearAsync(ficha);

        // Marcar el plan como completado (lógica de negocio — no debe vivir en el repositorio)
        var plan = await _planRepo.ObtenerPorIdAsync(request.PlanId);
        if (plan is not null)
        {
            plan.Estado = EstadoRevision.Completada;
            plan.FechaCompletada = DateTime.UtcNow;
            await _planRepo.ActualizarAsync(plan);
        }

        return ApiResponse<FichaRevisionResponse>.Ok(new FichaRevisionResponse
        {
            Id = creada.Id,
            Fecha = creada.Fecha,
            PresionAlta = creada.PresionAlta,
            PresionBaja = creada.PresionBaja,
            TempSalida = creada.TempSalida,
            GasTipo = creada.GasTipo,
            GasCantidad = creada.GasCantidad,
            Notas = creada.Notas,
            Componentes = creada.Componentes.Select(c => new ComponenteRevisionResponse
            {
                Componente = c.Componente,
                Estado = c.Estado.ToString(),
                Observacion = c.Observacion
            }).ToList()
        }, "Ficha registrada exitosamente");
    }

    private static PlanRevisionResponse MapearResponse(PlanRevision p) => new()
    {
        Id = p.Id,
        Numero = p.Numero,
        Estado = p.Estado.ToString(),
        FechaProgramada = p.FechaProgramada,
        FechaCompletada = p.FechaCompletada,
        TieneFicha = p.Ficha is not null,
        Ficha = p.Ficha is null ? null : new FichaRevisionResponse
        {
            Id = p.Ficha.Id,
            Fecha = p.Ficha.Fecha,
            PresionAlta = p.Ficha.PresionAlta,
            PresionBaja = p.Ficha.PresionBaja,
            TempSalida = p.Ficha.TempSalida,
            GasTipo = p.Ficha.GasTipo,
            GasCantidad = p.Ficha.GasCantidad,
            Notas = p.Ficha.Notas,
            Tecnico = p.Ficha.Tecnico?.Nombre ?? string.Empty,
            Componentes = p.Ficha.Componentes.Select(c => new ComponenteRevisionResponse
            {
                Componente = c.Componente,
                Estado = c.Estado.ToString(),
                Observacion = c.Observacion
            }).ToList()
        }
    };
}
