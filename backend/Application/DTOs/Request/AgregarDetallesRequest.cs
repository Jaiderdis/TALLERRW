using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Request;

public class AgregarDetallesRequest
{
    [Required, MinLength(1, ErrorMessage = "Debe incluir al menos un servicio")]
    public List<int> ServiciosIds { get; set; } = [];
}
