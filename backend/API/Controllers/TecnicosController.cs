using Application.DTOs.Request;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class TecnicosController : ControllerBase
{
    private readonly ITecnicoService _tecnicoService;

    public TecnicosController(ITecnicoService tecnicoService)
    {
        _tecnicoService = tecnicoService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerActivos()
    {
        var result = await _tecnicoService.ObtenerActivosAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var result = await _tecnicoService.ObtenerPorIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearTecnicoRequest request)
    {
        var result = await _tecnicoService.CrearAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
