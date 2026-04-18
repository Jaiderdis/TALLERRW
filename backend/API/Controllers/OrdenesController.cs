using Application.DTOs.Request;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class OrdenesController : ControllerBase
{
    private readonly IOrdenService _ordenService;

    public OrdenesController(IOrdenService ordenService)
    {
        _ordenService = ordenService;
    }

    [HttpGet("hoy")]
    public async Task<IActionResult> ObtenerHoy()
    {
        var result = await _ordenService.ObtenerHoyAsync();
        return Ok(result);
    }

    [HttpGet("pendientes")]
    public async Task<IActionResult> ObtenerPendientes()
    {
        var result = await _ordenService.ObtenerPendientesAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var result = await _ordenService.ObtenerPorIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearOrdenRequest request)
    {
        var result = await _ordenService.CrearAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{id}/estado")]
    public async Task<IActionResult> ActualizarEstado(int id, [FromBody] ActualizarEstadoRequest request)
    {
        var result = await _ordenService.ActualizarEstadoAsync(id, request.Estado);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}