using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class FichaRevisionRepository : IFichaRevisionRepository
{
    private readonly TallerContext _context;

    public FichaRevisionRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<FichaRevision?> ObtenerPorIdAsync(int id)
    {
        return await _context.FichasRevision
            .Include(f => f.Componentes)
            .Include(f => f.Tecnico)
            .Include(f => f.Plan)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<FichaRevision?> ObtenerPorPlanAsync(int planId)
    {
        return await _context.FichasRevision
            .Include(f => f.Componentes)
            .Include(f => f.Tecnico)
            .FirstOrDefaultAsync(f => f.PlanId == planId);
    }

    public async Task<FichaRevision> CrearAsync(FichaRevision ficha)
    {
        // Al crear la ficha marcamos el plan como completado
        var plan = await _context.PlanesRevision
            .FirstOrDefaultAsync(p => p.Id == ficha.PlanId);

        if (plan is not null)
        {
            plan.Estado = EstadoRevision.Completada;
            plan.FechaCompletada = DateTime.UtcNow;
        }

        _context.FichasRevision.Add(ficha);
        await _context.SaveChangesAsync();
        return ficha;
    }
}