using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class DetalleOrden
    {
        public int Id { get; set; }
        public decimal Precio { get; set; }
        public string Notas { get; set; } = string.Empty;

        public int OrdenId { get; set; }
        public OrdenServicio Orden { get; set; } = null!;

        public int ServicioId { get; set; }
        public CatalogoServicio Servicio { get; set; } = null!;
    }
}
