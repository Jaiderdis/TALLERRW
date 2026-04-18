using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request
{
    public class CrearVehiculoRequest
    {
        [Required]
        [MaxLength(10)]
        public string Placa { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Marca { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Modelo { get; set; } = string.Empty;

        [Range(1900, 2100)]
        public int Anio { get; set; }

        [MaxLength(30)]
        public string Color { get; set; } = string.Empty;

        [Required]
        public int ClienteId { get; set; }

        public int? EmpresaId { get; set; }
    }
}
