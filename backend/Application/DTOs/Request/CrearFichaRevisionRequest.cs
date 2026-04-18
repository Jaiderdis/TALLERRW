using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request
{
    public class CrearFichaRevisionRequest
    {
        [Required]
        public int PlanId { get; set; }

        [Required]
        public int OrdenId { get; set; }

        [Required]
        public int TecnicoId { get; set; }

        public decimal PresionAlta { get; set; }
        public decimal PresionBaja { get; set; }
        public decimal TempSalida { get; set; }

        [MaxLength(20)]
        public string GasTipo { get; set; } = string.Empty;

        public decimal? GasCantidad { get; set; }

        [MaxLength(500)]
        public string Notas { get; set; } = string.Empty;

        [MinLength(1, ErrorMessage = "Debe incluir al menos un componente")]
        public List<ComponenteRequest> Componentes { get; set; } = [];
    }

    public class ComponenteRequest
    {
        [Required]
        [MaxLength(100)]
        public string Componente { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Estado { get; set; } = string.Empty;

        [MaxLength(300)]
        public string Observacion { get; set; } = string.Empty;
    }
}
