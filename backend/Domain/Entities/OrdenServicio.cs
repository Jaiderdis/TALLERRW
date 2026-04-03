using Domain.Entities;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class OrdenServicio
    {
        public int Id { get; set; }
        public EstadoOrden Estado { get; set; } = EstadoOrden.EnEspera;
        public Prioridad Prioridad { get; set; } = Prioridad.Normal;
        public int KmIngreso { get; set; }
        public string Observaciones { get; set; } = string.Empty;
        public DateTime FechaIngreso { get; set; } = DateTime.Now;
        public DateTime? FechaSalida { get; set; }

        // FK siempre requeridos
        public int VehiculoId { get; set; }
        public Vehiculo Vehiculo { get; set; } = null!;

        public int TecnicoId { get; set; }
        public Tecnico Tecnico { get; set; } = null!;

        public int ClienteId { get; set; }
        public Cliente Cliente { get; set; } = null!;

        // FK nullable — solo si es empresa
        public int? EmpresaId { get; set; }
        public Empresa? Empresa { get; set; }

        // Navegación
        public ICollection<DetalleOrden> Detalles { get; set; } = [];
        public ICollection<FichaRevision> Fichas { get; set; } = [];
    }
}
