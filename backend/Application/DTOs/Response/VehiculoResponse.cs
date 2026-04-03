using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response
{
    public class VehiculoResponse
    {
        public int Id { get; set; }
        public string Placa { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public int Anio { get; set; }
        public string Color { get; set; } = string.Empty;
        public ClienteResponse Cliente { get; set; } = null!;
        public EmpresaResponse? Empresa { get; set; }
        public List<PlanRevisionResponse> PlanesRevision { get; set; } = [];
        public int TotalVisitas { get; set; }
        public DateTime? UltimaVisita { get; set; }
    }
}
 