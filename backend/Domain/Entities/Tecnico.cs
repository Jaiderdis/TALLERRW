using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Tecnico
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public bool Activo { get; set; } = true;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        // Navegación
        public ICollection<OrdenServicio> Ordenes { get; set; } = [];
        public ICollection<FichaRevision> Fichas { get; set; } = [];
    }
}
