using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request
{
    public class BuscarVehiculoRequest
    {
        [Required]
        [MaxLength(10)]
        public string Placa { get; set; } = string.Empty;
    }
}
