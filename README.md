# Backend - La Pollería 77

Sistema de control de stock. API REST con Node.js, Express y MySQL.

## Requisitos

- Node.js 18+
- MySQL (por ejemplo con MySQL Workbench instalado y el servicio MySQL corriendo)

## Configuración

1. **Variables de entorno**

   Copia el archivo de ejemplo y edita:

   ```bash
   cp .env.example .env
   ```

   En `.env` configura:

   - `DB_PASSWORD` – contraseña de MySQL
   - `JWT_SECRET` – clave larga y aleatoria para los tokens (en producción obligatoria)
   - `CORS_ORIGIN` – URL del frontend (ej. `http://localhost:3000`)

2. **Base de datos**

   En MySQL Workbench ejecuta:

   ```
   database/scripts/init.sql
   ```

   Crea la base `la_polleria_77` y la tabla `usuarios` (username, nombre_completo, password_hash, rol, ultimo_login).

3. **Usuario inicial**

   Después de ejecutar `init.sql`:

   ```bash
   npm run seed
   ```

   Crea el usuario **admin** con contraseña **Admin123!** (cámbiala después).

## Instalación

```bash
npm install
```

## Ejecutar

- Desarrollo (nodemon):

  ```bash
  npm run dev
  ```

- Producción:

  ```bash
  npm start
  ```

Por defecto el servidor corre en `http://localhost:4000`.

## Autenticación

- **POST /api/auth/login**  
  Body: `{ "username": "admin", "password": "Admin123!" }`  
  Respuesta: `{ "ok": true, "data": { "user": { ... }, "token": "..." } }`  
  El frontend debe guardar el `token` y enviarlo en cada petición protegida en el header:  
  `Authorization: Bearer <token>`.

- **GET /api/auth/me**  
  Requiere header `Authorization: Bearer <token>`.  
  Devuelve el usuario actual (id, username, nombre_completo, rol, ultimo_login, etc.).

Roles: `admin` y `empleado`. El contenido que se muestra en el sistema puede variar según el rol.

## Endpoints

- `GET /health` – estado del API
- `POST /api/auth/login` – login (username + password)
- `GET /api/auth/me` – usuario actual (requiere token)
- `GET /api/usuarios` – listar usuarios (requiere token)
- `GET /api/usuarios/:id` – obtener usuario por id (requiere token)

## Estructura del proyecto

```
backend/
├── database/
│   └── scripts/
│       ├── init.sql    # Crear DB y tabla usuarios
│       └── seed.js     # npm run seed – usuario admin
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/    # auth, requireRole, errorHandler, notFound
│   ├── routes/
│   ├── services/      # auth.service (login, JWT, bcrypt)
│   ├── utils/
│   ├── app.js
│   └── index.js
├── .env.example
├── package.json
└── README.md
```
