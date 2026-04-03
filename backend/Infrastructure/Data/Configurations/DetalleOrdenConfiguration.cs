using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class DetalleOrdenConfiguration : IEntityTypeConfiguration<DetalleOrden>
{
    public void Configure(EntityTypeBuilder<DetalleOrden> builder)
    {
        builder.ToTable("DetallesOrden");
        builder.HasKey(d => d.Id);

        builder.Property(d => d.Precio).HasColumnType("decimal(10,2)");
        builder.Property(d => d.Notas).HasMaxLength(300);

        builder.HasOne(d => d.Orden)
               .WithMany(o => o.Detalles)
               .HasForeignKey(d => d.OrdenId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Servicio)
               .WithMany(s => s.Detalles)
               .HasForeignKey(d => d.ServicioId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}