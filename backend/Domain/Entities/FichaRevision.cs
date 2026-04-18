using Domain.Entities;

namespace Domain.Entities;

public class FichaRevision
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public decimal PresionAlta { get; set; }
    public decimal PresionBaja { get; set; }
    public decimal TempSalida { get; set; }
    public string GasTipo { get; set; } = string.Empty;
    public decimal? GasCantidad { get; set; }
    public string Notas { get; set; } = string.Empty;

    public int PlanId { get; set; }
    public PlanRevision Plan { get; set; } = null!;

    public int OrdenId { get; set; }
    public OrdenServicio Orden { get; set; } = null!;

    public int TecnicoId { get; set; }
    public Tecnico Tecnico { get; set; } = null!;
     
    // Navegación
    public ICollection<ComponenteRevision> Componentes { get; set; } = [];
}