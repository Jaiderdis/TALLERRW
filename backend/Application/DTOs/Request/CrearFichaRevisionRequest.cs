using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Request
{
    public class CrearFichaRevisionRequest
    {
        public int PlanId { get; set; }
        public int OrdenId { get; set; }
        public int TecnicoId { get; set; }
        public decimal PresionAlta { get; set; }
        public decimal PresionBaja { get; set; }
        public decimal TempSalida { get; set; }
        public string GasTipo { get; set; } = string.Empty;
        public decimal? GasCantidad { get; set; }
        public string Notas { get; set; } = string.Empty;
        public List<ComponenteRequest> Componentes { get; set; } = [];
    }

    public class ComponenteRequest
    {
        public string Componente { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string Observacion { get; set; } = string.Empty;
    }
}
