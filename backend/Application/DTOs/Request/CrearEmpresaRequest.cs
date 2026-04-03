using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Request
{
    public class CrearEmpresaRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Nit { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactoNombre { get; set; } = string.Empty;
        public string ContactoTelefono { get; set; } = string.Empty;
    }
}
