using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response
{
    public class CatalogoServicioResponse
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public decimal PrecioBase { get; set; }
        public bool GeneraPlanRevision { get; set; }
    }
}
