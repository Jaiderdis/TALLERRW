using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Request
{
    public class CrearVehiculoRequest
    {
        public string Placa { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int Anio { get; set; }
        public string Color { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public int? EmpresaId { get; set; }
    }
}
