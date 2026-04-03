using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response
{
    public class ClienteResponse
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Cedula { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public EmpresaResponse? Empresa { get; set; }
    }
}
