using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request
{
    public class CrearOrdenRequest
    {
        [Required]
        public int VehiculoId { get; set; }

        [Required]
        public int TecnicoId { get; set; }

        [Required]
        public int ClienteId { get; set; }

        public int? EmpresaId { get; set; }

        [MaxLength(20)]
        public string Prioridad { get; set; } = "Normal";

        [Range(0, int.MaxValue)]
        public int KmIngreso { get; set; }

        [MaxLength(500)]
        public string Observaciones { get; set; } = string.Empty;

        [MinLength(1, ErrorMessage = "Debe incluir al menos un servicio")]
        public List<int> ServiciosIds { get; set; } = [];
    }
}
