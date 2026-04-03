using Application.DTOs.Request;
using Application.DTOs.Response;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public class EmpresaService : IEmpresaService
{
    private readonly IEmpresaRepository _empresaRepo;

    public EmpresaService(IEmpresaRepository empresaRepo)
    {
        _empresaRepo = empresaRepo;
    }

    public async Task<ApiResponse<List<EmpresaResponse>>> ObtenerTodasAsync()
    {
        var empresas = await _empresaRepo.ObtenerTodasAsync();
        var response = empresas.Select(MapearResponse).ToList();
        return ApiResponse<List<EmpresaResponse>>.Ok(response);
    }

    public async Task<ApiResponse<EmpresaResponse>> ObtenerPorIdAsync(int id)
    {
        var empresa = await _empresaRepo.ObtenerPorIdAsync(id);
        if (empresa is null)
            return ApiResponse<EmpresaResponse>.Fail("Empresa no encontrada");

        return ApiResponse<EmpresaResponse>.Ok(MapearResponse(empresa));
    }

    public async Task<ApiResponse<EmpresaResponse>> CrearAsync(CrearEmpresaRequest request)
    {
        var existe = await _empresaRepo.ObtenerPorNitAsync(request.Nit);
        if (existe is not null)
            return ApiResponse<EmpresaResponse>.Fail("Ya existe una empresa con ese NIT");

        var empresa = new Empresa
        {
            Nombre = request.Nombre,
            Nit = request.Nit,
            Direccion = request.Direccion,
            Telefono = request.Telefono,
            Email = request.Email,
            ContactoNombre = request.ContactoNombre,
            ContactoTelefono = request.ContactoTelefono
        };

        var creada = await _empresaRepo.CrearAsync(empresa);
        return ApiResponse<EmpresaResponse>.Ok(MapearResponse(creada), "Empresa registrada exitosamente");
    }

    public async Task<ApiResponse<EmpresaResponse>> ActualizarAsync(int id, CrearEmpresaRequest request)
    {
        var empresa = await _empresaRepo.ObtenerPorIdAsync(id);
        if (empresa is null)
            return ApiResponse<EmpresaResponse>.Fail("Empresa no encontrada");

        empresa.Nombre = request.Nombre;
        empresa.Nit = request.Nit;
        empresa.Direccion = request.Direccion;
        empresa.Telefono = request.Telefono;
        empresa.Email = request.Email;
        empresa.ContactoNombre = request.ContactoNombre;
        empresa.ContactoTelefono = request.ContactoTelefono;

        var actualizada = await _empresaRepo.ActualizarAsync(empresa);
        return ApiResponse<EmpresaResponse>.Ok(MapearResponse(actualizada), "Empresa actualizada exitosamente");
    }

    private static EmpresaResponse MapearResponse(Empresa e) => new()
    {
        Id = e.Id,
        Nombre = e.Nombre,
        Nit = e.Nit,
        Telefono = e.Telefono,
        Email = e.Email,
        ContactoNombre = e.ContactoNombre,
        ContactoTelefono = e.ContactoTelefono
    };
}