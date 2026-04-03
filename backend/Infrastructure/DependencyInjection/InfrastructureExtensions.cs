using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.DependencyInjection;

public static class InfrastructureExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Registrar DbContext con SQL Server
        services.AddDbContext<TallerContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        // Registrar repositorios
        services.AddScoped<IVehiculoRepository, VehiculoRepository>();
        services.AddScoped<IClienteRepository, ClienteRepository>();
        services.AddScoped<IEmpresaRepository, EmpresaRepository>();
        services.AddScoped<ITecnicoRepository, TecnicoRepository>();
        services.AddScoped<IOrdenRepository, OrdenRepository>();
        services.AddScoped<ICatalogoServicioRepository, CatalogoServicioRepository>();
        services.AddScoped<IPlanRevisionRepository, PlanRevisionRepository>();
        services.AddScoped<IFichaRevisionRepository, FichaRevisionRepository>();

        return services;
    }
}