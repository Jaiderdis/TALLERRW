using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request
{
    public class CrearTecnicoRequest
    {
        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Telefono { get; set; } = string.Empty;
    }
}
