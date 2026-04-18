using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class EmpresaRepository : IEmpresaRepository
{
    private readonly TallerContext _context;

    public EmpresaRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<Empresa?> ObtenerPorIdAsync(int id)
    {
        return await _context.Empresas
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Empresa?> ObtenerPorNitAsync(string nit)
    {
        return await _context.Empresas
            .FirstOrDefaultAsync(e => e.Nit == nit);
    }

    public async Task<IEnumerable<Empresa>> ObtenerTodasAsync()
    {
        return await _context.Empresas
            .Where(e => e.Activo)
            .OrderBy(e => e.Nombre)
            .ToListAsync();
    }

    public async Task<Empresa> CrearAsync(Empresa empresa)
    {
        _context.Empresas.Add(empresa);
        await _context.SaveChangesAsync();
        return empresa;
    }

    public async Task<Empresa> ActualizarAsync(Empresa empresa)
    {
        await _context.SaveChangesAsync();
        return empresa;
    }
}