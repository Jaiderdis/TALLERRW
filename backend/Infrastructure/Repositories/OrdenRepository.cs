using Dapper;
using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Infrastructure.Repositories;

public class OrdenRepository : IOrdenRepository
{
    private readonly TallerContext _context;
    private readonly IDbConnection _connection;

    public OrdenRepository(TallerContext context, IDbConnection connection)
    {
        _context = context;
        _connection = connection;
    }

    public async Task<OrdenServicio?> ObtenerPorIdAsync(int id)
    {
        return await _context.OrdenesServicio
            .Include(o => o.Vehiculo)
            .Include(o => o.Tecnico)
            .Include(o => o.Cliente)
            .Include(o => o.Empresa)
            .Include(o => o.Detalles)
                .ThenInclude(d => d.Servicio)
            .FirstOrDefaultAsync(o => o.Id == id);
    }

    public async Task<IEnumerable<OrdenServicio>> ObtenerPorFechaAsync(DateTime fecha)
    {
        const string sql = @"
            SELECT
                o.Id, o.Estado, o.Prioridad, o.KmIngreso, o.Observaciones,
                o.FechaIngreso, o.FechaSalida,
                o.VehiculoId, o.TecnicoId, o.ClienteId, o.EmpresaId,
                v.Id, v.Placa, v.Marca, v.Modelo, v.Anio, v.Color,
                v.ClienteId, v.EmpresaId, v.FechaCreacion,
                t.Id, t.Nombre, t.Telefono, t.Activo, t.FechaCreacion,
                c.Id, c.Nombre, c.Cedula, c.Telefono, c.Email, c.Tipo,
                c.EmpresaId, c.FechaCreacion,
                e.Id, e.Nombre, e.Nit, e.Direccion, e.Telefono, e.Email,
                e.ContactoNombre, e.ContactoTelefono, e.Activo, e.FechaCreacion
            FROM OrdenesServicio o
            INNER JOIN Vehiculos v ON v.Id = o.VehiculoId
            INNER JOIN Tecnicos t  ON t.Id = o.TecnicoId
            INNER JOIN Clientes c  ON c.Id = o.ClienteId
            LEFT  JOIN Empresas e  ON e.Id = o.EmpresaId
            WHERE CAST(o.FechaIngreso AS DATE) = CAST(@Fecha AS DATE)
            ORDER BY o.FechaIngreso DESC";

        var ordenes = await _connection.QueryAsync<OrdenServicio, Vehiculo, Tecnico, Cliente, Empresa?, OrdenServicio>(
            sql,
            (orden, vehiculo, tecnico, cliente, empresa) =>
            {
                orden.Vehiculo = vehiculo;
                orden.Tecnico = tecnico;
                orden.Cliente = cliente;
                orden.Empresa = empresa;
                return orden;
            },
            new { Fecha = fecha.Date },
            splitOn: "Id,Id,Id,Id");

        var ordenList = ordenes.ToList();

        // Cargar detalles en una segunda consulta para evitar producto cartesiano
        if (ordenList.Count > 0)
        {
            var ordenIds = ordenList.Select(o => o.Id).ToList();
            const string detallesSql = @"
                SELECT d.Id, d.Precio, d.Notas, d.OrdenId, d.ServicioId,
                       s.Id, s.Nombre, s.Descripcion, s.PrecioBase, s.Activo, s.GeneraPlanRevision
                FROM DetallesOrden d
                INNER JOIN CatalogoServicios s ON s.Id = d.ServicioId
                WHERE d.OrdenId IN @Ids";

            var detalles = await _connection.QueryAsync<DetalleOrden, CatalogoServicio, DetalleOrden>(
                detallesSql,
                (detalle, servicio) =>
                {
                    detalle.Servicio = servicio;
                    return detalle;
                },
                new { Ids = ordenIds },
                splitOn: "Id");

            var detallesPorOrden = detalles.GroupBy(d => d.OrdenId)
                                           .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var orden in ordenList)
            {
                if (detallesPorOrden.TryGetValue(orden.Id, out var ordenDetalles))
                    orden.Detalles = ordenDetalles;
            }
        }

        return ordenList;
    }

    public async Task<IEnumerable<OrdenServicio>> ObtenerPendientesAsync()
    {
        const string sql = @"
            SELECT
                o.Id, o.Estado, o.Prioridad, o.KmIngreso, o.Observaciones,
                o.FechaIngreso, o.FechaSalida,
                o.VehiculoId, o.TecnicoId, o.ClienteId, o.EmpresaId,
                v.Id, v.Placa, v.Marca, v.Modelo, v.Anio, v.Color,
                v.ClienteId, v.EmpresaId, v.FechaCreacion,
                t.Id, t.Nombre, t.Telefono, t.Activo, t.FechaCreacion,
                c.Id, c.Nombre, c.Cedula, c.Telefono, c.Email, c.Tipo,
                c.EmpresaId, c.FechaCreacion,
                e.Id, e.Nombre, e.Nit, e.Direccion, e.Telefono, e.Email,
                e.ContactoNombre, e.ContactoTelefono, e.Activo, e.FechaCreacion
            FROM OrdenesServicio o
            INNER JOIN Vehiculos v ON v.Id = o.VehiculoId
            INNER JOIN Tecnicos t  ON t.Id = o.TecnicoId
            INNER JOIN Clientes c  ON c.Id = o.ClienteId
            LEFT  JOIN Empresas e  ON e.Id = o.EmpresaId
            WHERE o.Estado IN ('EnEspera', 'EnProceso')
            ORDER BY o.FechaIngreso DESC";

        var ordenes = await _connection.QueryAsync<OrdenServicio, Vehiculo, Tecnico, Cliente, Empresa?, OrdenServicio>(
            sql,
            (orden, vehiculo, tecnico, cliente, empresa) =>
            {
                orden.Vehiculo = vehiculo;
                orden.Tecnico = tecnico;
                orden.Cliente = cliente;
                orden.Empresa = empresa;
                return orden;
            },
            splitOn: "Id,Id,Id,Id");

        var ordenList = ordenes.ToList();

        if (ordenList.Count > 0)
        {
            var ordenIds = ordenList.Select(o => o.Id).ToList();
            const string detallesSql = @"
                SELECT d.Id, d.Precio, d.Notas, d.OrdenId, d.ServicioId,
                       s.Id, s.Nombre, s.Descripcion, s.PrecioBase, s.Activo, s.GeneraPlanRevision
                FROM DetallesOrden d
                INNER JOIN CatalogoServicios s ON s.Id = d.ServicioId
                WHERE d.OrdenId IN @Ids";

            var detalles = await _connection.QueryAsync<DetalleOrden, CatalogoServicio, DetalleOrden>(
                detallesSql,
                (detalle, servicio) =>
                {
                    detalle.Servicio = servicio;
                    return detalle;
                },
                new { Ids = ordenIds },
                splitOn: "Id");

            var detallesPorOrden = detalles.GroupBy(d => d.OrdenId)
                                           .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var orden in ordenList)
            {
                if (detallesPorOrden.TryGetValue(orden.Id, out var ordenDetalles))
                    orden.Detalles = ordenDetalles;
            }
        }

        return ordenList;
    }

    public async Task<OrdenServicio> CrearAsync(OrdenServicio orden)
    {
        _context.OrdenesServicio.Add(orden);
        await _context.SaveChangesAsync();
        return orden;
    }

    public async Task<OrdenServicio> ActualizarAsync(OrdenServicio orden)
    {
        await _context.SaveChangesAsync();
        return orden;
    }
}
