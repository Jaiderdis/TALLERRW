using Domain.Enums;

namespace Domain.Entities;

public class ComponenteRevision
{
    public int Id { get; set; }
    public string Componente { get; set; } = string.Empty;
    public EstadoComponente Estado { get; set; } = EstadoComponente.Bien;
    public string Observacion { get; set; } = string.Empty;

    public int FichaId { get; set; }
    public FichaRevision Ficha { get; set; } = null!;
}
