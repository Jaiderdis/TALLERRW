using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response;

public class OrdenResponse
{
    public int Id { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Prioridad { get; set; } = string.Empty;
    public int KmIngreso { get; set; }
    public string Observaciones { get; set; } = string.Empty;
    public DateTime FechaIngreso { get; set; }
    public DateTime? FechaSalida { get; set; }
    public VehiculoResponse Vehiculo { get; set; } = null!;
    public TecnicoResponse Tecnico { get; set; } = null!;
    public ClienteResponse Cliente { get; set; } = null!;
    public EmpresaResponse? Empresa { get; set; }
    public List<DetalleOrdenResponse> Detalles { get; set; } = [];
}

public class DetalleOrdenResponse
{
    public int Id { get; set; }
    public string Servicio { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public string Notas { get; set; } = string.Empty;
}