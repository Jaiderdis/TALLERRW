using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Data;

public class TallerContextFactory : IDesignTimeDbContextFactory<TallerContext>
{
    public TallerContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<TallerContext>()
            .UseSqlServer(@"Server=DESKTOP-RIG93J0\SQLEXPRESS;Database=TALLERRW;Trusted_Connection=True;TrustServerCertificate=True;")
            .Options;

        return new TallerContext(options);
    }
}
