using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces.Repositories
{
    public interface IPlanRevisionRepository
    {
        Task<IEnumerable<PlanRevision>> ObtenerPorVehiculoAsync(int vehiculoId);
        Task<PlanRevision?> ObtenerSiguientePendienteAsync(int vehiculoId);
        Task<PlanRevision?> ObtenerPorIdAsync(int id);
        Task CrearPlanCompletoAsync(int vehiculoId, int ordenOrigenId);
        Task<PlanRevision> ActualizarAsync(PlanRevision plan);
    }
}
