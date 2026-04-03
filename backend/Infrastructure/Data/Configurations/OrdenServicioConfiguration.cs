using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class OrdenServicioConfiguration : IEntityTypeConfiguration<OrdenServicio>
{
    public void Configure(EntityTypeBuilder<OrdenServicio> builder)
    {
        builder.ToTable("OrdenesServicio");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Estado).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Prioridad).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Observaciones).HasMaxLength(500);

        builder.HasOne(o => o.Vehiculo)
               .WithMany(v => v.Ordenes)
               .HasForeignKey(o => o.VehiculoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Tecnico)
               .WithMany(t => t.Ordenes)
               .HasForeignKey(o => o.TecnicoId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Cliente)
               .WithMany(c => c.Ordenes)
               .HasForeignKey(o => o.ClienteId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Empresa)
               .WithMany(e => e.Ordenes)
               .HasForeignKey(o => o.EmpresaId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}