# TallerRW — Contexto del Proyecto

Pega este archivo al inicio de una conversación con cualquier modelo de IA para darle contexto completo del proyecto.

---

## ¿Qué es TallerRW?

Sistema de gestión para un taller de aire acondicionado vehicular. Permite a los mecánicos registrar vehículos, crear órdenes de servicio y llevar fichas de revisión técnica. Uso interno en el taller (tablet fija) y consulta remota del dueño.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | ASP.NET Core 10, Clean Architecture |
| Base de datos | SQL Server Express (local, misma PC) |
| ORM | EF Core 10 (CRUD simple) + Dapper (consultas complejas) |
| Mobile | React Native + Expo + TypeScript |
| Validaciones frontend | Zod |
| Notificaciones | react-native-toast-message |
| Navegación | React Navigation Stack |

**API URL local:** `http://192.168.0.3:35373/api/v1`
**Scalar (docs):** `https://localhost:35372/scalar/v1`

---

## Arquitectura Backend — Clean Architecture

```
backend/
├── Domain/          # Entidades, enums, interfaces de repositorio. Sin dependencias externas.
├── Application/     # Servicios, DTOs (Request/Response), interfaces IService. Solo depende de Domain.
├── Infrastructure/  # Repositorios (EF Core + Dapper), DbContext, migraciones. Depende de Domain.
└── API/             # Controllers, ErrorHandlingMiddleware, Program.cs. Depende de Application.
```

**Regla ORM:**
- **EF Core** → CRUD, queries por PK/FK, operaciones con change tracking, Include de 1-2 niveles
- **Dapper** → joins de 3+ tablas, reportes, consultas complejas, rendimiento crítico

**Patrón de respuesta — todos los endpoints retornan:**
```csharp
ApiResponse<T> {
  bool Success;
  string Message;
  T Data;
  List<string> Errors;
}
// Uso en controllers:
return Ok(ApiResponse<T>.Success(data));
return BadRequest(ApiResponse<T>.Failure("mensaje"));
```

**Registro DI:** `InfrastructureExtensions.cs` registra todos los repos/servicios.

---

## Arquitectura Mobile

```
src/
├── api/           # config.ts (axios), apiHelper.ts (llamarApi), un archivo por entidad
├── screens/       # Una pantalla por archivo
├── navigation/    # AppNavigator.tsx (Stack)
├── hooks/         # Custom hooks (useEmpresas, useNuevaOrdenData, useOrdenesHoy)
├── schemas/       # Validaciones Zod (nuevoVehiculo.ts, nuevaOrden.ts)
├── components/    # Componentes reutilizables (SectionTitle, PrimaryButton)
├── theme/         # index.ts — COLORS, SPACING, RADIUS, estilos base
└── types/         # index.ts — interfaces TypeScript
```

**Patrón API — todas las llamadas van por `llamarApi()`:**
```typescript
// apiHelper.ts — convierte errores de red en success:false
const result = await llamarApi(() => buscarPorPlaca(placa));
if (result.success) { /* usar result.data */ }
else { /* mostrar error con Toast */ }

// config.ts — interceptor convierte HTTP 4xx/5xx en Promise.resolve (error-as-data)
// Solo errores de red son Promise.reject
```

**Contrato compartido:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
```

---

## Modelo de Dominio

```
Empresa (opcional, multi-tenant)
  └── Cliente → Vehiculo → OrdenServicio → DetalleOrden
                        └── PlanRevision → FichaRevision → ComponenteRevision
                                                         └── Tecnico

CatalogoServicio → DetalleOrden
  flag: generaPlanRevision (si true, crea PlanRevision al generar la orden)
```

**Entidades clave:**
- `Vehiculo`: placa (PK lógica), marca, modelo, anio, color
- `OrdenServicio`: estado (Pendiente/EnProceso/Completada), prioridad, km, tecnicoId, clienteId, vehiculoId
- `PlanRevision`: estado (Pendiente/Completada), fechaCompletada
- `FichaRevision`: resultado por componente, observaciones, tecnicoId
- `CatalogoServicio`: nombre, precioBase, generaPlanRevision

---

## Pantallas

| Pantalla | Estado | Descripción |
|---|---|---|
| BuscarPlaca | ✅ Done | Entrada principal. Teclado QWERTY custom, slots de placa, manejo error red vs 404 |
| VehiculoScreen | ✅ Done | Detalle del vehículo + historial de órdenes |
| NuevoVehiculo | ✅ Done | Formulario con Zod, busca cliente por cédula |
| NuevaOrden | ✅ Done | Selección de servicios del catálogo, técnico, prioridad, km |
| OrdenesHoy | ✅ Done | Lista de órdenes del día con cambio de estado |
| FichaRevision | ⏳ Pendiente | Params: `{ planId, ordenId, vehiculoId }` |

**Navegación:**
```typescript
type RootStackParamList = {
  BuscarPlaca: undefined;
  Vehiculo: { vehiculo: Vehiculo };
  NuevoVehiculo: { placa: string };
  NuevaOrden: { vehiculo: Vehiculo };
  FichaRevision: { planId: number; ordenId: number; vehiculoId: number };
  OrdenesHoy: undefined;
};
```

**UI conventions:**
- Dark theme — fondo `#0a0f14`, tarjeta `#111920`, input `#1a2332`, acento `#00c8ff`
- Colores centralizados en `src/theme/index.ts`
- Toast para feedback (error/success/info)
- Botones mínimo 48-54px alto (uso con guantes)

---

## Endpoints API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/vehiculos/{placa}` | Buscar vehículo por placa |
| POST | `/vehiculos` | Crear vehículo |
| GET | `/clientes/{id}` | Obtener cliente por ID |
| GET | `/clientes/cedula/{cedula}` | Buscar cliente por cédula |
| POST | `/clientes` | Crear cliente |
| GET | `/catalogo` | Obtener catálogo de servicios |
| GET | `/tecnicos` | Obtener todos los técnicos |
| POST | `/ordenes` | Crear orden de servicio |
| GET | `/ordenes/hoy` | Órdenes del día |
| GET | `/ordenes/pendientes` | Órdenes pendientes |
| PUT | `/ordenes/{id}/estado` | Actualizar estado de orden |
| GET | `/revisiones/vehiculo/{vehiculoId}` | Planes de revisión del vehículo |
| GET | `/revisiones/vehiculo/{vehiculoId}/siguiente` | Próximo plan pendiente |
| POST | `/revisiones` | Registrar ficha de revisión |
| GET | `/empresas` | Obtener empresas |

---

## Decisiones técnicas tomadas

1. **Sin autenticación por ahora** — taller único, tablet fija. Se implementará JWT con roles cuando se construya el módulo de contabilidad.
2. **Sin hosting cloud por ahora** — negocio pequeño, sede única. Acceso remoto del dueño via Tailscale (VPN gratuita). Se evaluará cloud cuando entre el módulo contable.
3. **EF Core + Dapper híbrido** — EF para CRUD, Dapper para queries con 3+ joins.
4. **Error-as-data pattern** — axios interceptor convierte 4xx/5xx en resolved promises. Solo errores de red son rejected.
5. **Teclado QWERTY custom en BuscarPlaca** — tablet con mecánicos con guantes, teclas 54px mínimo.
6. **Zod para validaciones** — reemplaza validación manual en formularios.

---

## Comandos útiles

```bash
# Backend
dotnet build backend/TALLERRW.slnx
dotnet run --project backend/API/
dotnet ef migrations add NombreMigracion --project backend/Infrastructure/ --startup-project backend/API/
dotnet ef database update --project backend/Infrastructure/ --startup-project backend/API/

# Mobile
npm install
npm start
npm run android
```

---

## Lo que falta construir

1. **FichaRevision screen** — pantalla principal pendiente. Muestra componentes del plan, permite marcar cada uno con su resultado (OK/Falla/Pendiente) y guardar la ficha completa.
2. **Módulo de contabilidad** — proyecto futuro separado, disparará la decisión de hosting cloud.
3. **Autenticación JWT** — cuando entre el módulo contable.
4. **APK para distribución** — EAS Build para generar APK sin Play Store.
