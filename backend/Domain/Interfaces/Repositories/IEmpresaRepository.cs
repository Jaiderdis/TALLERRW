using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces.Repositories
{
    public interface IEmpresaRepository
    {
        Task<Empresa?> ObtenerPorIdAsync(int id);
        Task<Empresa?> ObtenerPorNitAsync(string nit);
        Task<IEnumerable<Empresa>> ObtenerTodasAsync();
        Task<Empresa> CrearAsync(Empresa empresa);
        Task<Empresa> ActualizarAsync(Empresa empresa);
    }
}
