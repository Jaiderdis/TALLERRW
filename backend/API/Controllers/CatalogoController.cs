using Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class CatalogoController : ControllerBase
{
    private readonly ICatalogoServicioService _catalogoService;

    public CatalogoController(ICatalogoServicioService catalogoService)
    {
        _catalogoService = catalogoService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerActivos()
    {
        var result = await _catalogoService.ObtenerActivosAsync();
        return Ok(result);
    }
}