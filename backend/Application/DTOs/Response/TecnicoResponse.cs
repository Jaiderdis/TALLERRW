using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Response;

public class TecnicoResponse
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public bool Activo { get; set; }
}