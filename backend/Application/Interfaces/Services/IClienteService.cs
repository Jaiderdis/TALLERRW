using Application.DTOs.Request;
using Application.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.Services;

public interface IClienteService
{
    Task<ApiResponse<ClienteResponse>> ObtenerPorIdAsync(int id);
    Task<ApiResponse<ClienteResponse>> ObtenerPorCedulaAsync(string cedula);
    Task<ApiResponse<ClienteResponse>> CrearAsync(CrearClienteRequest request);
    Task<ApiResponse<ClienteResponse>> ActualizarAsync(int id, CrearClienteRequest request);
}
