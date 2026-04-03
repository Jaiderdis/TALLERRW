using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response;

public class PlanRevisionResponse
{
    public int Id { get; set; }
    public int Numero { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime? FechaProgramada { get; set; }
    public DateTime? FechaCompletada { get; set; }
    public bool TieneFicha { get; set; }
    public FichaRevisionResponse? Ficha { get; set; }
}