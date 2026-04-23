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

    public async Task<Vehiculo?> ObtenerResumenPorPlacaAsync(string placa)
    {
        var vehiculo = await _context.Vehiculos
            .Include(v => v.Cliente)
                .ThenInclude(c => c.Empresa)
            .Include(v => v.Empresa)
            .Include(v => v.Ordenes.OrderByDescending(o => o.FechaIngreso).Take(1))
            .Include(v => v.PlanesRevision)
                .ThenInclude(p => p.OrdenOrigen)
            .Include(v => v.PlanesRevision)
                .ThenInclude(p => p.Ficha)
                    .ThenInclude(f => f!.Componentes)
            .Include(v => v.PlanesRevision)
                .ThenInclude(p => p.Ficha)
                    .ThenInclude(f => f!.Tecnico)
            .FirstOrDefaultAsync(v => v.Placa == placa.ToUpper().Trim());

        if (vehiculo is not null)
        {
            vehiculo.TotalOrdenes = await _context.OrdenesServicio
                .CountAsync(o => o.VehiculoId == vehiculo.Id);
            vehiculo.UltimaOrdenFecha = vehiculo.Ordenes.FirstOrDefault()?.FechaIngreso;
        }

        return vehiculo;
    }

    public async Task<Vehiculo?> ObtenerDetalleCompletoAsync(string placa)
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