using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces.Repositories
{
    public interface ICatalogoServicioRepository
    {
        Task<IEnumerable<CatalogoServicio>> ObtenerTodosAsync();
        Task<IEnumerable<CatalogoServicio>> ObtenerActivosAsync();
        Task<CatalogoServicio?> ObtenerPorIdAsync(int id);
    }
}
