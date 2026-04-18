using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces.Repositories
{
    public interface IVehiculoRepository
    {
        Task<Vehiculo?> ObtenerResumenPorPlacaAsync(string placa);
        Task<Vehiculo?> ObtenerDetalleCompletoAsync(string placa);
        Task<Vehiculo?> ObtenerPorIdAsync(int id);
        Task<Vehiculo> CrearAsync(Vehiculo vehiculo);
        Task<bool> ExistePorPlacaAsync(string placa);
    }
}
