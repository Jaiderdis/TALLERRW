using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces.Repositories
{
    public interface IFichaRevisionRepository
    {
        Task<FichaRevision?> ObtenerPorIdAsync(int id);
        Task<FichaRevision?> ObtenerPorPlanAsync(int planId);
        Task<FichaRevision> CrearAsync(FichaRevision ficha);
    }
}
