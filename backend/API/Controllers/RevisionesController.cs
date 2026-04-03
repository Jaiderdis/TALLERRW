using Application.DTOs.Request;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class RevisionesController : ControllerBase
{
    private readonly IPlanRevisionService _planService;

    public RevisionesController(IPlanRevisionService planService)
    {
        _planService = planService;
    }

    [HttpGet("vehiculo/{vehiculoId}")]
    public async Task<IActionResult> ObtenerPorVehiculo(int vehiculoId)
    {
        var result = await _planService.ObtenerPorVehiculoAsync(vehiculoId);
        return Ok(result);
    }

    [HttpGet("vehiculo/{vehiculoId}/siguiente")]
    public async Task<IActionResult> ObtenerSiguiente(int vehiculoId)
    {
        var result = await _planService.ObtenerSiguienteAsync(vehiculoId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("ficha")]
    public async Task<IActionResult> RegistrarFicha([FromBody] CrearFichaRevisionRequest request)
    {
        var result = await _planService.RegistrarFichaAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}