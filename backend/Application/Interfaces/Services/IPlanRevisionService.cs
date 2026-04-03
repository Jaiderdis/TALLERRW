using Application.DTOs.Request;
using Application.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.Services;

public interface IPlanRevisionService
{
    // Estado del plan completo del vehículo — las 3 revisiones
    Task<ApiResponse<List<PlanRevisionResponse>>> ObtenerPorVehiculoAsync(int vehiculoId);

    // La próxima revisión pendiente
    Task<ApiResponse<PlanRevisionResponse>> ObtenerSiguienteAsync(int vehiculoId);

    // Registrar la ficha técnica de una revisión
    Task<ApiResponse<FichaRevisionResponse>> RegistrarFichaAsync(CrearFichaRevisionRequest request);
}
