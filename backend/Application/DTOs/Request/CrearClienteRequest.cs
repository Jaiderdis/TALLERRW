using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request
{
    public class CrearClienteRequest
    {
        [Required]
        [MaxLength(150)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Cedula { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Telefono { get; set; } = string.Empty;

        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public int? EmpresaId { get; set; }
    }
}
