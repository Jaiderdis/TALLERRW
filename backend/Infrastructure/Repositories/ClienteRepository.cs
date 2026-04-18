using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly TallerContext _context;

    public ClienteRepository(TallerContext context)
    {
        _context = context;
    }

    public async Task<Cliente?> ObtenerPorIdAsync(int id)
    {
        return await _context.Clientes
            .Include(c => c.Empresa)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Cliente?> ObtenerPorCedulaAsync(string cedula)
    {
        return await _context.Clientes
            .Include(c => c.Empresa)
            .FirstOrDefaultAsync(c => c.Cedula == cedula);
    }

    public async Task<Cliente> CrearAsync(Cliente cliente)
    {
        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();
        return cliente;
    }

    public async Task<Cliente> ActualizarAsync(Cliente cliente)
    {
        await _context.SaveChangesAsync();
        return cliente;
    }

    public async Task<bool> ExistePorCedulaAsync(string cedula)
    {
        return await _context.Clientes
            .AnyAsync(c => c.Cedula == cedula);
    }
}
