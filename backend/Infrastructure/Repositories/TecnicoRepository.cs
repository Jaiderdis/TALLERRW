using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TecnicoRepository : ITecnicoRepository
{
    private readonly TallerContext _context;

    public TecnicoRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Tecnico>> ObtenerActivosAsync()
    {
        return await _context.Tecnicos
            .Where(t => t.Activo)
            .OrderBy(t => t.Nombre)
            .ToListAsync();
    }

    public async Task<Tecnico?> ObtenerPorIdAsync(int id)
    {
        return await _context.Tecnicos
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Tecnico> CrearAsync(Tecnico tecnico)
    {
        _context.Tecnicos.Add(tecnico);
        await _context.SaveChangesAsync();
        return tecnico;
    }

    public async Task<Tecnico> ActualizarAsync(Tecnico tecnico)
    {
        await _context.SaveChangesAsync();
        return tecnico;
    }
}