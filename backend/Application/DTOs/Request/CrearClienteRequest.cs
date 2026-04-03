using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Request
{
    public class CrearClienteRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Cedula { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int? EmpresaId { get; set; }
    }
}
