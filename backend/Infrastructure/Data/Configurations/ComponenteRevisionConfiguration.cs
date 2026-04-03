using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ComponenteRevisionConfiguration : IEntityTypeConfiguration<ComponenteRevision>
{
    public void Configure(EntityTypeBuilder<ComponenteRevision> builder)
    {
        builder.ToTable("ComponentesRevision");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Componente).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Estado).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Observacion).HasMaxLength(300);

        builder.HasOne(c => c.Ficha)
               .WithMany(f => f.Componentes)
               .HasForeignKey(c => c.FichaId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}