using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities;

public class CatalogoServicio
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal PrecioBase { get; set; }
    public bool Activo { get; set; } = true;
    public bool GeneraPlanRevision { get; set; } = false;
    // true solo en servicios de aire acondicionado

    public ICollection<DetalleOrden> Detalles { get; set; } = [];
}