using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class FichaRevisionConfiguration : IEntityTypeConfiguration<FichaRevision>
{
    public void Configure(EntityTypeBuilder<FichaRevision> builder)
    {
        builder.ToTable("FichasRevision");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.PresionAlta).HasColumnType("decimal(8,2)");
        builder.Property(f => f.PresionBaja).HasColumnType("decimal(8,2)");
        builder.Property(f => f.TempSalida).HasColumnType("decimal(8,2)");
        builder.Property(f => f.GasTipo).HasMaxLength(20);
        builder.Property(f => f.GasCantidad).HasColumnType("decimal(8,2)");
        builder.Property(f => f.Notas).HasMaxLength(500);

        builder.HasOne(f => f.Plan)
               .WithOne(p => p.Ficha)
               .HasForeignKey<FichaRevision>(f => f.PlanId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Orden)
               .WithMany(o => o.Fichas)
               .HasForeignKey(f => f.OrdenId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Tecnico)
               .WithMany(t => t.Fichas)
               .HasForeignKey(f => f.TecnicoId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}