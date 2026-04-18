using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CatalogoServicioRepository : ICatalogoServicioRepository
{
    private readonly TallerContext _context;

    public CatalogoServicioRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CatalogoServicio>> ObtenerTodosAsync()
    {
        return await _context.CatalogoServicios
            .OrderBy(s => s.Nombre)
            .ToListAsync();
    }

    public async Task<IEnumerable<CatalogoServicio>> ObtenerActivosAsync()
    {
        return await _context.CatalogoServicios
            .Where(s => s.Activo)
            .OrderBy(s => s.Nombre)
            .ToListAsync();
    }

    public async Task<CatalogoServicio?> ObtenerPorIdAsync(int id)
    {
        return await _context.CatalogoServicios
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<IEnumerable<CatalogoServicio>> ObtenerPorIdsAsync(IEnumerable<int> ids)
    {
        return await _context.CatalogoServicios
            .Where(s => ids.Contains(s.Id))
            .ToListAsync();
    }
}