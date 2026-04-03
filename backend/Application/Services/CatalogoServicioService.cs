using Application.DTOs.Response;
using Application.Interfaces.Services;
using Domain.Interfaces.Repositories;

namespace Application.Services;

public class CatalogoServicioService : ICatalogoServicioService
{
    private readonly ICatalogoServicioRepository _catalogoRepo;

    public CatalogoServicioService(ICatalogoServicioRepository catalogoRepo)
    {
        _catalogoRepo = catalogoRepo;
    }

    public async Task<ApiResponse<List<CatalogoServicioResponse>>> ObtenerActivosAsync()
    {
        var servicios = await _catalogoRepo.ObtenerActivosAsync();
        var response = servicios.Select(s => new CatalogoServicioResponse
        {
            Id = s.Id,
            Nombre = s.Nombre,
            Descripcion = s.Descripcion,
            PrecioBase = s.PrecioBase,
            GeneraPlanRevision = s.GeneraPlanRevision
        }).ToList();

        return ApiResponse<List<CatalogoServicioResponse>>.Ok(response);
    }
}