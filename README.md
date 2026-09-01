# Tenis-Ahora-Frontend

SPA en React + Vite del TP **"Tenis Ahora"** (UNAJ). El **login y el registro** hablan con
la API real ([tenis-ahora-backend](https://github.com/aaronfuenzalida/tenis-ahora-backend));
el resto de los módulos todavía usa los datos mock de `src/utils/mockData.js`.

## Requisitos

- Node.js 20+ y npm
- El backend corriendo en `http://localhost:5090` (ver su README)

## Puesta en marcha

```bash
npm install
cp .env.example .env    # en Windows: copy .env.example .env
npm run dev
```

Queda en `http://localhost:5173`.

### Variables de entorno

| Variable | Valor por defecto | Qué es |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5090/api` | URL base de la API |

El archivo `.env` está en `.gitignore`: cada uno usa su copia local de `.env.example`.

## Cómo funciona la autenticación

1. `LoginPage` / `RegisterPage` llaman a `authService` (`src/services/api.js`), que hace
   `POST /api/auth/login` o `POST /api/auth/registrar`.
2. La API devuelve el `AuthResponseDto`: token JWT + datos del usuario + rol.
3. `AuthContext` traduce el rol del backend (`Socio` / `Empleado`) al del front
   (`client` / `admin`), guarda token y perfil en `localStorage` y expone `useAuth()`.
4. El interceptor de axios manda el token en `Authorization: Bearer <token>` en cada request.
5. Si el token venció, `getStoredToken()` lo descarta y la app vuelve al login.

## Primer uso

No hay usuarios precargados: entrá a `/register` y creá tu cuenta. Todo usuario nuevo
se crea con rol `Socio`; para probar el panel de administración hay que cambiarle el rol
a `Empleado` en la base (o usar el botón de demo del navbar, que solo cambia la vista).
