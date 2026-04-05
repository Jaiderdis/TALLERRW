using Application.DTOs.Request;
using Application.DTOs.Response;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.Services
{
    public interface IOrdenService
    {
        // Crea la orden y si algún servicio tiene GeneraPlanRevision = true,
        // crea automáticamente el plan de 3 revisiones
        Task<ApiResponse<OrdenResponse>> CrearAsync(CrearOrdenRequest request);

        Task<ApiResponse<OrdenResponse>> ObtenerPorIdAsync(int id);

        // Todas las órdenes del día — para la pantalla principal del técnico
        Task<ApiResponse<List<OrdenResponse>>> ObtenerHoyAsync();

        // Órdenes pendientes (EnEspera o EnProceso) sin filtro de fecha
        Task<ApiResponse<List<OrdenResponse>>> ObtenerPendientesAsync();

        // Cambia el estado: EnEspera → EnProceso → Completada
        Task<ApiResponse<OrdenResponse>> ActualizarEstadoAsync(int id, string estado);
    }
}
