using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Request
{
    public class CrearTecnicoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
    }
}
