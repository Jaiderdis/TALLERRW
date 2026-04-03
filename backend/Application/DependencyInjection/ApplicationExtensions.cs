using Application.Interfaces.Services;
using Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Application.DependencyInjection;

public static class ApplicationExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IVehiculoService, VehiculoService>();
        services.AddScoped<IClienteService, ClienteService>();
        services.AddScoped<IEmpresaService, EmpresaService>();
        services.AddScoped<ITecnicoService, TecnicoService>();
        services.AddScoped<IOrdenService, OrdenService>();
        services.AddScoped<ICatalogoServicioService, CatalogoServicioService>();
        services.AddScoped<IPlanRevisionService, PlanRevisionService>();

        return services;
    }
}