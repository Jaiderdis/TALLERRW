using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class VehiculoRepository : IVehiculoRepository
{
    private readonly TallerContext _context;

    public VehiculoRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<Vehiculo?> ObtenerPorPlacaAsync(string placa)
    {
        return await _context.Vehiculos
            .Include(v => v.Cliente)
                .ThenInclude(c => c.Empresa)
            .Include(v => v.Empresa)
            .Include(v => v.Ordenes)
            .Include(v => v.PlanesRevision)
                .ThenInclude(p => p.Ficha)
                    .ThenInclude(f => f!.Componentes)
            .FirstOrDefaultAsync(v => v.Placa == placa.ToUpper().Trim());
    }

    public async Task<Vehiculo?> ObtenerPorIdAsync(int id)
    {
        return await _context.Vehiculos
            .Include(v => v.Cliente)
            .Include(v => v.Empresa)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<Vehiculo> CrearAsync(Vehiculo vehiculo)
    {
        _context.Vehiculos.Add(vehiculo);
        await _context.SaveChangesAsync();
        return vehiculo;
    }

    public async Task<bool> ExistePorPlacaAsync(string placa)
    {
        return await _context.Vehiculos
            .AnyAsync(v => v.Placa == placa.ToUpper().Trim());
    }
}