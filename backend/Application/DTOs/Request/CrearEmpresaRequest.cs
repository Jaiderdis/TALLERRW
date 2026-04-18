using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request
{
    public class CrearEmpresaRequest
    {
        [Required]
        [MaxLength(150)]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Nit { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Direccion { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Telefono { get; set; } = string.Empty;

        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(100)]
        public string ContactoNombre { get; set; } = string.Empty;

        [MaxLength(20)]
        public string ContactoTelefono { get; set; } = string.Empty;
    }
}
