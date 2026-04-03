using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response;

public class FichaRevisionResponse
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public decimal PresionAlta { get; set; }
    public decimal PresionBaja { get; set; }
    public decimal TempSalida { get; set; }
    public string GasTipo { get; set; } = string.Empty;
    public decimal? GasCantidad { get; set; }
    public string Notas { get; set; } = string.Empty;
    public string Tecnico { get; set; } = string.Empty;
    public List<ComponenteRevisionResponse> Componentes { get; set; } = [];
}

public class ComponenteRevisionResponse
{
    public string Componente { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string Observacion { get; set; } = string.Empty;
}