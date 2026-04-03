using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities;

public class Empresa
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Nit { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ContactoNombre { get; set; } = string.Empty;
    public string ContactoTelefono { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    // Navegación
    public ICollection<Cliente> Clientes { get; set; } = [];
    public ICollection<Vehiculo> Vehiculos { get; set; } = [];
    public ICollection<OrdenServicio> Ordenes { get; set; } = [];
}