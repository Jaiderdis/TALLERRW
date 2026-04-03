using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Request
{
    public class CrearOrdenRequest
    {
        public int VehiculoId { get; set; }
        public int TecnicoId { get; set; }
        public int ClienteId { get; set; }
        public int? EmpresaId { get; set; }
        public string Prioridad { get; set; } = "Normal";
        public int KmIngreso { get; set; }
        public string Observaciones { get; set; } = string.Empty;
        public List<int> ServiciosIds { get; set; } = [];
    }
}
