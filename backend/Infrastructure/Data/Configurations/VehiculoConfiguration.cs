using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VehiculoConfiguration : IEntityTypeConfiguration<Vehiculo>
{
    public void Configure(EntityTypeBuilder<Vehiculo> builder)
    {
        builder.ToTable("Vehiculos");
        builder.HasKey(v => v.Id);

        builder.Property(v => v.Placa).IsRequired().HasMaxLength(10);
        builder.Property(v => v.Marca).IsRequired().HasMaxLength(50);
        builder.Property(v => v.Modelo).IsRequired().HasMaxLength(50);
        builder.Property(v => v.Color).HasMaxLength(30);

        builder.HasIndex(v => v.Placa).IsUnique();

        // Relación con Cliente — obligatoria
        builder.HasOne(v => v.Cliente)
               .WithMany(c => c.Vehiculos)
               .HasForeignKey(v => v.ClienteId)
               .OnDelete(DeleteBehavior.Restrict);

        // Relación con Empresa — opcional
        builder.HasOne(v => v.Empresa)
               .WithMany(e => e.Vehiculos)
               .HasForeignKey(v => v.EmpresaId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}