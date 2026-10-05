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

## Primer uso y Modo Demo

- **Modo Demo (sin backend)**: Podés explorar toda la aplicación inmediatamente desde la pantalla de login haciendo clic en **Demo Socio** o **Demo Admin**. No requiere tener el backend levantado ni crear usuarios previamente. Dentro de la app, podés alternar en cualquier momento entre la vista de Socio y el Panel de Administración.
- **Con Backend (.NET en `http://localhost:5090`)**: Registrá un usuario desde `/register` o iniciá sesión con tus credenciales. Los nuevos usuarios se crean con rol `Socio`; para probar el panel de administración podés asignarle rol `Empleado` en la base de datos o usar el alternador de rol en la cabecera.
