using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Vehiculo
    {
        public int Id { get; set; }
        public string Placa { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int Anio { get; set; }
        public string Color { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        // FK — siempre tiene cliente
        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        // FK nullable — solo si viene por empresa
        public int? EmpresaId { get; set; }
        public Empresa? Empresa { get; set; }

        // Navegación
        public ICollection<OrdenServicio> Ordenes { get; set; } = [];
        public ICollection<PlanRevision> PlanesRevision { get; set; } = [];
    }
}
