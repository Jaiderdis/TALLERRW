using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public static class TallerContextSeeder
{
    public static async Task SeedAsync(TallerContext context, CancellationToken cancellationToken = default)
    {
        var empresasBase = new[]
        {
            new Empresa
            {
                Nombre = "CERPA",
                Nit = "900000001",
                Direccion = "Pendiente por confirmar",
                Telefono = "3000000001",
                Email = "contacto@cerpa.com",
                ContactoNombre = "Pendiente",
                ContactoTelefono = "3000000001"
            },
            new Empresa
            {
                Nombre = "AGROMINEROS",
                Nit = "900000002",
                Direccion = "Pendiente por confirmar",
                Telefono = "3000000002",
                Email = "contacto@agromineros.com",
                ContactoNombre = "Pendiente",
                ContactoTelefono = "3000000002"
            }
        };

        foreach (var empresa in empresasBase)
        {
            var existe = await context.Empresas.AnyAsync(
                e => e.Nombre == empresa.Nombre || e.Nit == empresa.Nit,
                cancellationToken);

            if (!existe)
            {
                context.Empresas.Add(empresa);
            }
        }

        if (context.ChangeTracker.HasChanges())
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
