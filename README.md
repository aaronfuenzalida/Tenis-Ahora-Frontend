# Tenis-Ahora-Frontend

SPA en React + Vite del TP **"Tenis Ahora"** (UNAJ). El **login y el registro** hablan con
la API real ([tenis-ahora-backend](https://github.com/aaronfuenzalida/tenis-ahora-backend));
el resto de los módulos también, salvo en la demo (`/demo`), que usa datos en memoria.

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

## Estructura del código

Cada carpeta de `src/modulos` es un módulo del TP y junta todas sus pantallas, estén en el panel de
administración, en el portal del socio o en el del profesor. Los archivos que terminan en `Page` son
pantallas con ruta propia (ver `App.jsx`); el resto son componentes que usan esas pantallas.

```
src/
  main.jsx            punto de entrada
  App.jsx             rutas de la app real y de la demo, y protección por rol
  api/                acceso a datos
    index.js          exporta los servicios; elige entre http.js y demo.js según la URL
    http.js           cliente axios y servicios contra la API real
    demo.js           los mismos servicios sobre datos en memoria (demo sin backend)
    demoData.js       datos iniciales de la demo (los genera server/seed/gen_seed.py)
    club.js           valores fijos del club: plazos de reserva y horario por defecto
  auth/               login, registro, sesión (AuthContext) y manejo del token JWT
  layout/             cabecera, menú lateral y perfil de cada portal
  ui/                 componentes genéricos: modal, avisos, paginación, QR, pasos
  utils/              formateadores, rutas de la demo, archivos adjuntos
  demo/               pantalla de entrada a la demo
  modulos/
    inicio/           pantalla inicial de cada portal
    usuarios/         padrón de socios, carnet y descuentos por usuario
    canchas/          canchas, tipos de cancha y horarios disponibles
    reservas/         reserva por pasos del socio y control de reservas
    stock/            productos y stock
    competencias/     torneos, ligas, enfrentamientos y tipos de competencia
    profesores/       cuerpo de profesores, certificaciones y perfil del profesor
    clases/           clases grupales, asistencia y clases particulares
    caja/             caja, recibos, pago, facturas, reembolsos y descuentos
    reportes/         reportes y estadísticas
```

## Módulos del panel de administración

Cobertura de los requerimientos funcionales del TP (RF001 - RF142). Todos los módulos permiten
registrar, modificar, consultar e imprimir (botón **Imprimir** de cada pantalla); el resto de las
operaciones se indica en cada caso.

| Pantalla | Módulos | Requerimientos |
|---|---|---|
| Padrón de Usuarios | Alta, modificación, baja, carnet, descuentos por usuario | RF001-005, RF138-141 |
| Canchas, Tipos y Horarios | Canchas (ABM + mantenimiento), tipos de cancha (ABM), horarios disponibles por cancha (días, franja, turnos, bloqueos) | RF006-019 |
| Control de Reservas | Modificar, eliminar, cobrar saldo, cancelar con política de 6 hs (genera reembolso o cargo), reporte | RF020-025, RD01-RD06 |
| Gestión de Stock | Productos y stock disponible | RF026-034 |
| Torneos, Ligas y Competencias | Torneos y ligas (ABM, cuadro, tabla, reglamento interno), inscripciones, enfrentamientos consolidados, tipos de competencia | RF035-065, RD12 |
| Profesores, Clases y Entrenamientos | Profesores y entrenadores (alta, horarios, certificaciones + reporte), clases y entrenamientos grupales (cupo configurable ≤ 30), inscripciones, asistencia, turnos particulares | RF066-124, RD07-RD10 |
| Caja, Facturas y Reembolsos | Recibos y cobros (débito, crédito, billetera virtual), facturas, reembolsos, políticas de descuento | RF125-142, RD11 |
| Reportes y Estadísticas | Ingresos, ocupación, canchas, asistencia a clases y entrenamientos | RF137 |

En la demo los datos de estos módulos viven en memoria (`src/api/demo.js` + `src/api/demoData.js`);
al recargar la página vuelven al estado inicial.

## Cómo funciona la autenticación

1. `LoginPage` / `RegisterPage` llaman a `authService` (`src/api/http.js`), que hace
   `POST /api/auth/login` o `POST /api/auth/registrar`.
2. La API devuelve el `AuthResponseDto`: token JWT + datos del usuario + rol.
3. `AuthContext` traduce el rol del backend (`Socio` / `Empleado`) al del front
   (`client` / `admin`), guarda token y perfil en `localStorage` y expone `useAuth()`.
4. El interceptor de axios manda el token en `Authorization: Bearer <token>` en cada request.
5. Si el token venció, `getStoredToken()` lo descarta y la app vuelve al login.

## Primer uso y demo

- **App real** (`/login`, `/register`, `/app`, `/coach`, `/admin`): requiere el backend levantado. Registrá un
  usuario desde `/register` o iniciá sesión con tus credenciales; el rol lo define el backend.
- **Demo** (`/demo`): entorno separado de la app real, sin backend y con datos de ejemplo en memoria.
  Desde `/demo` se elige el rol, o se entra directo a `/demo/app` (socio), `/demo/coach` (profesor) o
  `/demo/admin` (administración). La sesión demo vive en `sessionStorage` de la pestaña y nunca pisa la
  sesión real; dentro de la demo se puede alternar entre los tres roles.

## Otras notas de la interfaz

- **Mi Perfil**: socios, profesores y empleados editan nombre, teléfono y foto desde el avatar de la cabecera
  (o la tarjeta de la barra lateral). La foto se recorta en cuadrado y se guarda como data URL.
- **Códigos QR**: carnet de socio, recibos y cobros con billetera virtual muestran QR reales
  (`qrcode.react`), con el texto codificado en `src/ui/QRCode.jsx`.
- **Reserva por pasos**: cronograma → jugadores → pago de la seña, cada uno en su pantalla.
- **Portal del socio**: pantallas separadas para Torneos (`/app/torneos`), Ligas (`/app/ligas`), Clases y
  Entrenamientos grupales (`/app/clases`) y Clases Particulares (`/app/clases-particulares`).
- **Inscripciones**: anotarse a un torneo, liga, clase grupal o turno particular lleva al pago
  (`PaymentFlowModal`), que al acreditarse registra la inscripción y emite el recibo visible en
  *Mis Pagos y Recibos*.
- **Avisos**: no se usan `alert`/`confirm` del navegador; los mensajes salen como modales
  (`useFeedback()` en `src/ui/FeedbackContext.jsx`).
