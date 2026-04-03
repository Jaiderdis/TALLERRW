using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class EmpresaConfiguration : IEntityTypeConfiguration<Empresa>
{
    public void Configure(EntityTypeBuilder<Empresa> builder)
    {
        builder.ToTable("Empresas");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Nombre).IsRequired().HasMaxLength(150);
        builder.Property(e => e.Nit).IsRequired().HasMaxLength(20);
        builder.Property(e => e.Direccion).HasMaxLength(200);
        builder.Property(e => e.Telefono).HasMaxLength(20);
        builder.Property(e => e.Email).HasMaxLength(100);
        builder.Property(e => e.ContactoNombre).HasMaxLength(100);
        builder.Property(e => e.ContactoTelefono).HasMaxLength(20);

        builder.HasIndex(e => e.Nit).IsUnique();
    }
}