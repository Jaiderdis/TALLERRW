using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces.Repositories
{
    public interface ITecnicoRepository
    {
        Task<IEnumerable<Tecnico>> ObtenerActivosAsync();
        Task<Tecnico?> ObtenerPorIdAsync(int id);
        Task<Tecnico> CrearAsync(Tecnico tecnico);
        Task<Tecnico> ActualizarAsync(Tecnico tecnico);
    }
}
