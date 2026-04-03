using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CatalogoServicioConfiguration : IEntityTypeConfiguration<CatalogoServicio>
{
    public void Configure(EntityTypeBuilder<CatalogoServicio> builder)
    {
        builder.ToTable("CatalogoServicios");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Descripcion).HasMaxLength(300);
        builder.Property(c => c.PrecioBase).HasColumnType("decimal(10,2)");

        // Datos semilla — los servicios iniciales del taller
        builder.HasData(
            new CatalogoServicio { Id = 1, Nombre = "Carga Gas R134a", Descripcion = "Carga de gas refrigerante R134a", PrecioBase = 85000, GeneraPlanRevision = false },
            new CatalogoServicio { Id = 2, Nombre = "Carga Gas R1234yf", Descripcion = "Carga de gas refrigerante R1234yf", PrecioBase = 140000, GeneraPlanRevision = false },
            new CatalogoServicio { Id = 3, Nombre = "Instalación Aire AC", Descripcion = "Instalación completa sistema aire AC", PrecioBase = 350000, GeneraPlanRevision = true },
            new CatalogoServicio { Id = 4, Nombre = "Limpieza Evaporador", Descripcion = "Limpieza profunda del evaporador", PrecioBase = 120000, GeneraPlanRevision = false },
            new CatalogoServicio { Id = 5, Nombre = "Revisión Compresor", Descripcion = "Diagnóstico y revisión del compresor", PrecioBase = 60000, GeneraPlanRevision = false },
            new CatalogoServicio { Id = 6, Nombre = "Filtro de Cabina", Descripcion = "Cambio de filtro de cabina", PrecioBase = 35000, GeneraPlanRevision = false },
            new CatalogoServicio { Id = 7, Nombre = "Diagnóstico General", Descripcion = "Diagnóstico completo del sistema AC", PrecioBase = 45000, GeneraPlanRevision = false },
            new CatalogoServicio { Id = 8, Nombre = "Limpieza Condensador", Descripcion = "Limpieza del condensador", PrecioBase = 90000, GeneraPlanRevision = false },
            new CatalogoServicio { Id = 9, Nombre = "Detección de Fuga", Descripcion = "Detección y localización de fugas", PrecioBase = 50000, GeneraPlanRevision = false }
        );
    }
}