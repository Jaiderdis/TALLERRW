using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class OrdenRepository : IOrdenRepository
{
    private readonly TallerContext _context;

    public OrdenRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<OrdenServicio?> ObtenerPorIdAsync(int id)
    {
        return await _context.OrdenesServicio
            .Include(o => o.Vehiculo)
            .Include(o => o.Tecnico)
            .Include(o => o.Cliente)
            .Include(o => o.Empresa)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Servicio)
            .Include(o => o.Fichas)
                .ThenInclude(f => f.Componentes)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<IEnumerable<OrdenServicio>> ObtenerPorFechaAsync(DateTime fecha)
    {
        return await _context.OrdenesServicio
            .Include(o => o.Vehiculo)
            .Include(o => o.Tecnico)
            .Include(o => o.Cliente)
            .Include(o => o.Empresa)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Servicio)
            .Where(o => o.FechaIngreso.Date == fecha.Date)
            .OrderByDescending(o => o.FechaIngreso)
            .ToListAsync();
    }

    public async Task<IEnumerable<OrdenServicio>> ObtenerPendientesAsync()
    {
        return await _context.OrdenesServicio
            .Include(o => o.Vehiculo)
            .Include(o => o.Tecnico)
            .Include(o => o.Cliente)
            .Include(o => o.Empresa)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Servicio)
            .Where(o => o.Estado == Domain.Enums.EstadoOrden.EnEspera || o.Estado == Domain.Enums.EstadoOrden.EnProceso)
            .OrderByDescending(o => o.FechaIngreso)
            .ToListAsync();
    }

    public async Task<OrdenServicio> CrearAsync(OrdenServicio orden)
    {
        _context.OrdenesServicio.Add(orden);
        await _context.SaveChangesAsync();
        return orden;
    }

    public async Task<OrdenServicio> ActualizarAsync(OrdenServicio orden)
    {
        _context.OrdenesServicio.Update(orden);
        await _context.SaveChangesAsync();
        return orden;
    }
}