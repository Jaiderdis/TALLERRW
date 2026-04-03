using Application.DTOs.Request;
using Application.DTOs.Response;
using Application.Interfaces.Services;
using Domain.Entities;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public class TecnicoService : ITecnicoService
{
    private readonly ITecnicoRepository _tecnicoRepo;

    public TecnicoService(ITecnicoRepository tecnicoRepo)
    {
        _tecnicoRepo = tecnicoRepo;
    }

    public async Task<ApiResponse<List<TecnicoResponse>>> ObtenerActivosAsync()
    {
        var tecnicos = await _tecnicoRepo.ObtenerActivosAsync();
        var response = tecnicos.Select(MapearResponse).ToList();
        return ApiResponse<List<TecnicoResponse>>.Ok(response);
    }

    public async Task<ApiResponse<TecnicoResponse>> ObtenerPorIdAsync(int id)
    {
        var tecnico = await _tecnicoRepo.ObtenerPorIdAsync(id);
        if (tecnico is null)
            return ApiResponse<TecnicoResponse>.Fail("Técnico no encontrado");

        return ApiResponse<TecnicoResponse>.Ok(MapearResponse(tecnico));
    }

    public async Task<ApiResponse<TecnicoResponse>> CrearAsync(CrearTecnicoRequest request)
    {
        var tecnico = new Tecnico
        {
            Nombre = request.Nombre,
            Telefono = request.Telefono
        };

        var creado = await _tecnicoRepo.CrearAsync(tecnico);
        return ApiResponse<TecnicoResponse>.Ok(MapearResponse(creado), "Técnico registrado exitosamente");
    }

    private static TecnicoResponse MapearResponse(Tecnico t) => new()
    {
        Id = t.Id,
        Nombre = t.Nombre,
        Telefono = t.Telefono,
        Activo = t.Activo
    };
}