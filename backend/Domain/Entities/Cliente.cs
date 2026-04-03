using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Cliente
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Cedula { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public TipoCliente Tipo { get; set; } = TipoCliente.Natural;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        // FK nullable — solo si pertenece a una empresa
        public int? EmpresaId { get; set; }
        public Empresa? Empresa { get; set; }

        // Navegación
        public ICollection<Vehiculo> Vehiculos { get; set; } = [];
        public ICollection<OrdenServicio> Ordenes { get; set; } = [];
    }
}
