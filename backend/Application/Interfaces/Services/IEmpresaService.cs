using Application.DTOs.Request;
using Application.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.Services;

public interface IEmpresaService
{
    Task<ApiResponse<List<EmpresaResponse>>> ObtenerTodasAsync();
    Task<ApiResponse<EmpresaResponse>> ObtenerPorIdAsync(int id);
    Task<ApiResponse<EmpresaResponse>> CrearAsync(CrearEmpresaRequest request);
    Task<ApiResponse<EmpresaResponse>> ActualizarAsync(int id, CrearEmpresaRequest request);
}
