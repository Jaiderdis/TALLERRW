using System;
using System.Collections.Generic;
using System.Text;

using Application.DTOs.Request;
using Application.DTOs.Response;

namespace Application.Interfaces.Services;

public interface IVehiculoService
{
    // Busca el vehículo por placa — retorna null si no existe
    Task<ApiResponse<VehiculoResponse>> BuscarPorPlacaAsync(string placa);

    // Registra vehículo nuevo + cliente + crea el plan si aplica
    Task<ApiResponse<VehiculoResponse>> RegistrarAsync(CrearVehiculoRequest request);
}