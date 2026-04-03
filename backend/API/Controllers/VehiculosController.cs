using Application.Interfaces.Services;
using Application.DTOs.Request;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class VehiculosController : ControllerBase
{
    private readonly IVehiculoService _vehiculoService;

    public VehiculosController(IVehiculoService vehiculoService)
    {
        _vehiculoService = vehiculoService;
    }

    [HttpGet("{placa}")]
    public async Task<IActionResult> BuscarPorPlaca(string placa)
    {
        var result = await _vehiculoService.BuscarPorPlacaAsync(placa);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearVehiculoRequest request)
    {
        var result = await _vehiculoService.RegistrarAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}