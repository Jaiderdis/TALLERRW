using Domain.Entities;
using Infrastructure.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class TallerContext : DbContext
{
    public TallerContext(DbContextOptions<TallerContext> options) : base(options) { }

    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<Tecnico> Tecnicos => Set<Tecnico>();
    public DbSet<CatalogoServicio> CatalogoServicios => Set<CatalogoServicio>();
    public DbSet<OrdenServicio> OrdenesServicio => Set<OrdenServicio>();
    public DbSet<DetalleOrden> DetallesOrden => Set<DetalleOrden>();
    public DbSet<PlanRevision> PlanesRevision => Set<PlanRevision>();
    public DbSet<FichaRevision> FichasRevision => Set<FichaRevision>();
    public DbSet<ComponenteRevision> ComponentesRevision => Set<ComponenteRevision>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TallerContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}