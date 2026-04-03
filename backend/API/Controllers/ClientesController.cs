using Application.DTOs.Request;
using Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClientesController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var result = await _clienteService.ObtenerPorIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("cedula/{cedula}")]
    public async Task<IActionResult> ObtenerPorCedula(string cedula)
    {
        var result = await _clienteService.ObtenerPorCedulaAsync(cedula);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearClienteRequest request)
    {
        var result = await _clienteService.CrearAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] CrearClienteRequest request)
    {
        var result = await _clienteService.ActualizarAsync(id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}