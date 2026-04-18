# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TallerRW is a workshop management system for vehicular air conditioning. Two-tier stack:
- **Backend**: ASP.NET Core 10 Clean Architecture — `backend/`
- **Mobile**: React Native Expo TypeScript — `src/`

---

## Commands

### Backend (.NET)
```bash
dotnet restore backend/
dotnet build backend/TALLERRW.slnx
dotnet run --project backend/API/

# EF Core migrations
dotnet ef database update --project backend/Infrastructure/ --startup-project backend/API/
```

### Mobile (React Native Expo)
```bash
npm install
npm start          # interactive: choose platform
npm run android
npm run ios
npm run web
```

---

## Architecture

### Backend — Clean Architecture

```
backend/
├── Domain/        # Entities, enums, repository interfaces
├── Application/   # Services, DTOs (Request/Response), IService interfaces
├── Infrastructure/ # EF Core DbContext, repository implementations, migrations
└── API/           # Controllers, ErrorHandlingMiddleware, Program.cs
```

- All controllers use route `api/v1/[controller]` and return `ApiResponse<T>`
- `ErrorHandlingMiddleware` catches unhandled exceptions → 500 with formatted `ApiResponse`
- `Program.cs` calls `SeedDataAsync()` on startup (seeds companies CERPA and AGROMINEROS)
- DB: SQL Server Express — `DESKTOP-RIG93J0\SQLEXPRESS`, database `TALLERRW`

### Mobile — API Layer Pattern

All API calls go through `llamarApi()` in `src/api/apiHelper.ts`:

```typescript
// llamarApi wraps any axios call; network errors become success:false
const result = await llamarApi(() => buscarPorPlaca(placa));
if (result.success) { /* use result.data */ }
else { /* show result.errors */ }
```

`src/api/config.ts` — Axios instance with a response interceptor that converts HTTP 4xx/5xx into resolved promises (error-as-data pattern). Only network errors are rejected.

API URL: `EXPO_PUBLIC_API_URL` env var, defaults to `http://localhost:35373/api/v1`.

### Shared Response Contract

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}
```

Backend returns this for every endpoint. Frontend `llamarApi()` always resolves to this shape.

### Navigation

Stack navigator in `src/navigation/AppNavigator.tsx`. Entry point: `BuscarPlaca`.

```typescript
type RootStackParamList = {
  BuscarPlaca: undefined;
  Vehiculo: { vehiculo: any };
  NuevoVehiculo: { placa: string };
  NuevaOrden: { vehiculo: any };
  FichaRevision: { planId: number; ordenId: number; vehiculoId: number };
  OrdenesHoy: undefined;
};
```

### Domain Model (key relationships)

- `Empresa` → many `Cliente`, `Vehiculo`, `OrdenServicio` (Empresa is optional — multi-tenant capable)
- `Cliente` → many `Vehiculo`, `OrdenServicio`
- `Vehiculo` → many `OrdenServicio`, `PlanRevision`
- `OrdenServicio` → many `DetalleOrden`, `FichaRevision`; requires `Vehiculo`, `Tecnico`, `Cliente`
- `PlanRevision` → many `FichaRevision`
- `FichaRevision` → many `ComponenteRevision`; also linked to `Tecnico`
- `CatalogoServicio` → many `DetalleOrden`; flag `generaPlanRevision` controls whether a plan is created

### Screens status

| Screen | Status |
|---|---|
| BuscarPlaca | Done |
| VehiculoScreen | Done |
| NuevoVehiculo | Done |
| NuevaOrden | Done |
| OrdenesHoy | Done |
| FichaRevision | Pending |

### UI Conventions

- Dark theme: background `#0a0f14`, accent `#00c8ff`
- Toast notifications via `react-native-toast-message` (configured in `App.tsx`)
