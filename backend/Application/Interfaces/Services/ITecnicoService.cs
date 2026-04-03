using Application.DTOs.Request;
using Application.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.Services;

public interface ITecnicoService
{
    Task<ApiResponse<List<TecnicoResponse>>> ObtenerActivosAsync();
    Task<ApiResponse<TecnicoResponse>> ObtenerPorIdAsync(int id);
    Task<ApiResponse<TecnicoResponse>> CrearAsync(CrearTecnicoRequest request);
}