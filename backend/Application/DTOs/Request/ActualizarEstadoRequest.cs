using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request;

public class ActualizarEstadoRequest
{
    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = string.Empty;
}