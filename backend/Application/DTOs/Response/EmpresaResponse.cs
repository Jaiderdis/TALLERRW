using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response
{
    public class EmpresaResponse
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Nit { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string ContactoNombre { get; set; } = string.Empty;
        public string ContactoTelefono { get; set; } = string.Empty;
    }
}
