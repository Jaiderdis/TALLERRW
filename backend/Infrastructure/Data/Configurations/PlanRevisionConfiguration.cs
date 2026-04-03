using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PlanRevisionConfiguration : IEntityTypeConfiguration<PlanRevision>
{
    public void Configure(EntityTypeBuilder<PlanRevision> builder)
    {
        builder.ToTable("PlanesRevision");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Estado).HasConversion<string>().HasMaxLength(20);

        builder.HasOne(p => p.Vehiculo)
               .WithMany(v => v.PlanesRevision)
               .HasForeignKey(p => p.VehiculoId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.OrdenOrigen)
               .WithMany()
               .HasForeignKey(p => p.OrdenOrigenId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}