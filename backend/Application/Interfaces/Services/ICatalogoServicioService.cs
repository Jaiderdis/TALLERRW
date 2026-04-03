using Application.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.Services;

public interface ICatalogoServicioService
{
    Task<ApiResponse<List<CatalogoServicioResponse>>> ObtenerActivosAsync();
}
