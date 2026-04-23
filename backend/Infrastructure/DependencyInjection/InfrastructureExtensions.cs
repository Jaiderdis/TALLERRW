using System.Data;
using Application.Interfaces;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.Data.SqlClient;
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
        var connectionString = configuration.GetConnectionString("DefaultConnection")!;

        // Registrar DbContext con SQL Server
        services.AddDbContext<TallerContext>(options =>
            options.UseSqlServer(connectionString));

        // Registrar IDbConnection para Dapper (scoped — una conexión por request)
        services.AddScoped<IDbConnection>(_ => new SqlConnection(connectionString));

        // Registrar UnitOfWork
        services.AddScoped<IUnitOfWork, UnitOfWork>();

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