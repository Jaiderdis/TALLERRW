using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class PlanRevision
    {
        public int Id { get; set; }
        public int Numero { get; set; }  // 1, 2 o 3
        public EstadoRevision Estado { get; set; } = EstadoRevision.Pendiente;
        public DateTime? FechaProgramada { get; set; }
        public DateTime? FechaCompletada { get; set; }

        public int VehiculoId { get; set; }
        public Vehiculo Vehiculo { get; set; } = null!;

        // FK — orden que originó este plan
        public int OrdenOrigenId { get; set; }
        public OrdenServicio OrdenOrigen { get; set; } = null!;

        // Navegación
        public FichaRevision? Ficha { get; set; }
    }
}
