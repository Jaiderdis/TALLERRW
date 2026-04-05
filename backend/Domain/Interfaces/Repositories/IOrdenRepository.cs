using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces.Repositories
{
    public interface IOrdenRepository
    {
        Task<OrdenServicio?> ObtenerPorIdAsync(int id);
        Task<IEnumerable<OrdenServicio>> ObtenerPorFechaAsync(DateTime fecha);
        Task<IEnumerable<OrdenServicio>> ObtenerPendientesAsync();
        Task<OrdenServicio> CrearAsync(OrdenServicio orden);
        Task<OrdenServicio> ActualizarAsync(OrdenServicio orden);
    }
}
