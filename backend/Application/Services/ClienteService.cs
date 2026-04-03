using Application.DTOs.Request;
using Application.DTOs.Response;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _clienteRepo;

    public ClienteService(IClienteRepository clienteRepo)
    {
        _clienteRepo = clienteRepo;
    }

    public async Task<ApiResponse<ClienteResponse>> ObtenerPorIdAsync(int id)
    {
        var cliente = await _clienteRepo.ObtenerPorIdAsync(id);
        if (cliente is null)
            return ApiResponse<ClienteResponse>.Fail("Cliente no encontrado");

        return ApiResponse<ClienteResponse>.Ok(MapearResponse(cliente));
    }

    public async Task<ApiResponse<ClienteResponse>> ObtenerPorCedulaAsync(string cedula)
    {
        var cliente = await _clienteRepo.ObtenerPorCedulaAsync(cedula);
        if (cliente is null)
            return ApiResponse<ClienteResponse>.Fail("Cliente no encontrado");

        return ApiResponse<ClienteResponse>.Ok(MapearResponse(cliente));
    }

    public async Task<ApiResponse<ClienteResponse>> CrearAsync(CrearClienteRequest request)
    {
        if (await _clienteRepo.ExistePorCedulaAsync(request.Cedula))
            return ApiResponse<ClienteResponse>.Fail("Ya existe un cliente con esa cédula");

        var cliente = new Cliente
        {
            Nombre = request.Nombre,
            Cedula = request.Cedula,
            Telefono = request.Telefono,
            Email = request.Email,
            EmpresaId = request.EmpresaId,
            Tipo = request.EmpresaId.HasValue ? TipoCliente.Empresa : TipoCliente.Natural
        };

        var creado = await _clienteRepo.CrearAsync(cliente);
        return ApiResponse<ClienteResponse>.Ok(MapearResponse(creado), "Cliente registrado exitosamente");
    }

    public async Task<ApiResponse<ClienteResponse>> ActualizarAsync(int id, CrearClienteRequest request)
    {
        var cliente = await _clienteRepo.ObtenerPorIdAsync(id);
        if (cliente is null)
            return ApiResponse<ClienteResponse>.Fail("Cliente no encontrado");

        cliente.Nombre = request.Nombre;
        cliente.Telefono = request.Telefono;
        cliente.Email = request.Email;
        cliente.EmpresaId = request.EmpresaId;
        cliente.Tipo = request.EmpresaId.HasValue ? TipoCliente.Empresa : TipoCliente.Natural;

        var actualizado = await _clienteRepo.ActualizarAsync(cliente);
        return ApiResponse<ClienteResponse>.Ok(MapearResponse(actualizado), "Cliente actualizado exitosamente");
    }

    private static ClienteResponse MapearResponse(Cliente c) => new()
    {
        Id = c.Id,
        Nombre = c.Nombre,
        Cedula = c.Cedula,
        Telefono = c.Telefono,
        Email = c.Email,
        Tipo = c.Tipo.ToString(),
        Empresa = c.Empresa is null ? null : new EmpresaResponse
        {
            Id = c.Empresa.Id,
            Nombre = c.Empresa.Nombre,
            Nit = c.Empresa.Nit,
            Telefono = c.Empresa.Telefono,
            Email = c.Empresa.Email,
            ContactoNombre = c.Empresa.ContactoNombre,
            ContactoTelefono = c.Empresa.ContactoTelefono
        }
    };
}