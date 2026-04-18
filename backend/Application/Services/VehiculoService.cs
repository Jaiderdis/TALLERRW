using Application.DTOs.Request;
using Application.DTOs.Response;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public class VehiculoService : IVehiculoService
{
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly IClienteRepository _clienteRepo;

    public VehiculoService(IVehiculoRepository vehiculoRepo, IClienteRepository clienteRepo)
    {
        _vehiculoRepo = vehiculoRepo;
        _clienteRepo = clienteRepo;
    }

    public async Task<ApiResponse<VehiculoResponse>> BuscarPorPlacaAsync(string placa)
    {
        var vehiculo = await _vehiculoRepo.ObtenerResumenPorPlacaAsync(placa.ToUpper().Trim());

        if (vehiculo is null)
            return ApiResponse<VehiculoResponse>.Fail($"No se encontró vehículo con placa {placa}");

        return ApiResponse<VehiculoResponse>.Ok(MapearResponse(vehiculo));
    }

    public async Task<ApiResponse<VehiculoResponse>> RegistrarAsync(CrearVehiculoRequest request)
    {
        // Verificar que la placa no exista
        if (await _vehiculoRepo.ExistePorPlacaAsync(request.Placa.ToUpper().Trim()))
            return ApiResponse<VehiculoResponse>.Fail($"Ya existe un vehículo con la placa {request.Placa}");

        // Verificar que el cliente exista
        var cliente = await _clienteRepo.ObtenerPorIdAsync(request.ClienteId);
        if (cliente is null)
            return ApiResponse<VehiculoResponse>.Fail("El cliente no existe");

        var vehiculo = new Vehiculo
        {
            Placa = request.Placa.ToUpper().Trim(),
            Marca = request.Marca,
            Modelo = request.Modelo,
            Anio = request.Anio,
            Color = request.Color,
            ClienteId = request.ClienteId,
            EmpresaId = request.EmpresaId
        };

        var creado = await _vehiculoRepo.CrearAsync(vehiculo);
        return ApiResponse<VehiculoResponse>.Ok(MapearResponse(creado), "Vehículo registrado exitosamente");
    }

    // Mapea la entidad al DTO de respuesta
    private static VehiculoResponse MapearResponse(Vehiculo v) => new()
    {
        Id = v.Id,
        Placa = v.Placa,
        Marca = v.Marca,
        Modelo = v.Modelo,
        Anio = v.Anio,
        Color = v.Color,
        TotalVisitas = v.Ordenes?.Count ?? 0,
        UltimaVisita = v.Ordenes?.OrderByDescending(o => o.FechaIngreso).FirstOrDefault()?.FechaIngreso,
        Cliente = v.Cliente is null ? null! : new ClienteResponse
        {
            Id = v.Cliente.Id,
            Nombre = v.Cliente.Nombre,
            Cedula = v.Cliente.Cedula,
            Telefono = v.Cliente.Telefono,
            Email = v.Cliente.Email,
            Tipo = v.Cliente.Tipo.ToString()
        },
        Empresa = v.Empresa is null ? null : new EmpresaResponse
        {
            Id = v.Empresa.Id,
            Nombre = v.Empresa.Nombre,
            Nit = v.Empresa.Nit,
            Telefono = v.Empresa.Telefono,
            Email = v.Empresa.Email,
            ContactoNombre = v.Empresa.ContactoNombre,
            ContactoTelefono = v.Empresa.ContactoTelefono
        },
        PlanesRevision = v.PlanesRevision?.Select(p => new PlanRevisionResponse
        {
            Id = p.Id,
            Numero = p.Numero,
            Estado = p.Estado.ToString(),
            FechaProgramada = p.FechaProgramada,
            FechaCompletada = p.FechaCompletada,
            TieneFicha = p.Ficha is not null
        }).ToList() ?? []
    };
}