using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Clientes");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(c => c.Cedula).IsRequired().HasMaxLength(20);
        builder.Property(c => c.Telefono).HasMaxLength(20);
        builder.Property(c => c.Email).HasMaxLength(100);
        builder.Property(c => c.Tipo).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(c => c.Cedula).IsUnique();

        // Relación con Empresa — opcional
        builder.HasOne(c => c.Empresa)
               .WithMany(e => e.Clientes)
               .HasForeignKey(c => c.EmpresaId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}