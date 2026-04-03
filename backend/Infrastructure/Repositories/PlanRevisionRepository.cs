using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PlanRevisionRepository : IPlanRevisionRepository
{
    private readonly TallerContext _context;

    public PlanRevisionRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PlanRevision>> ObtenerPorVehiculoAsync(int vehiculoId)
    {
        return await _context.PlanesRevision
            .Include(p => p.Ficha)
                .ThenInclude(f => f!.Componentes)
            .Include(p => p.Ficha)
                .ThenInclude(f => f!.Tecnico)
            .Where(p => p.VehiculoId == vehiculoId)
            .OrderBy(p => p.Numero)
            .ToListAsync();
    }

    public async Task<PlanRevision?> ObtenerSiguientePendienteAsync(int vehiculoId)
    {
        return await _context.PlanesRevision
            .Where(p => p.VehiculoId == vehiculoId && p.Estado == EstadoRevision.Pendiente)
            .OrderBy(p => p.Numero)
            .FirstOrDefaultAsync();
    }

    public async Task CrearPlanCompletoAsync(int vehiculoId, int ordenOrigenId)
    {
        // Crea las 3 revisiones automáticamente
        // Revisión 1: 1 mes después
        // Revisión 2: 3 meses después
        // Revisión 3: 6 meses después
        var planes = new List<PlanRevision>
        {
            new() {
                VehiculoId = vehiculoId,
                OrdenOrigenId = ordenOrigenId,
                Numero = 1,
                Estado = EstadoRevision.Pendiente,
                FechaProgramada = DateTime.UtcNow.AddMonths(1)
            },
            new() {
                VehiculoId = vehiculoId,
                OrdenOrigenId = ordenOrigenId,
                Numero = 2,
                Estado = EstadoRevision.Pendiente,
                FechaProgramada = DateTime.UtcNow.AddMonths(3)
            },
            new() {
                VehiculoId = vehiculoId,
                OrdenOrigenId = ordenOrigenId,
                Numero = 3,
                Estado = EstadoRevision.Pendiente,
                FechaProgramada = DateTime.UtcNow.AddMonths(6)
            }
        };

        _context.PlanesRevision.AddRange(planes);
        await _context.SaveChangesAsync();
    }

    public async Task<PlanRevision> ActualizarAsync(PlanRevision plan)
    {
        _context.PlanesRevision.Update(plan);
        await _context.SaveChangesAsync();
        return plan;
    }
}