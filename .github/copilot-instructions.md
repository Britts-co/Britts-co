# Copilot Project Instructions

Purpose: Fast orientation for AI agents contributing to this Node.js Express + MySQL backend used for forms, downloads, and simple auth.

## Architecture & Data Flow
- Entry point: `server.js` sets up Express 5, JSON/urlencoded parsing, CORS, Multer for uploads, and mounts feature routers.
- Routers / features:
  - Form + contact email handling (inline in `server.js`) using `nodemailer` with SMTP env vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`).
  - Requerimientos API: mounted at `/api/requerimientosdb` from `requerimientosdb.js` (CRUD-like: currently POST create, GET list/group). Persists into MySQL table `DBW00002` with columns: `Requerimiento, Correo, Asunto, Tipo, Solución, Programa, Version, Detalle, Contacto`.
  - Descargas API: `descargas.js` mounted at root; endpoint `/descargas/:codigo` queries table `DBW00001` returning grouped solution assets (fields aliased: solucion, nombre, imagen, programa, manual).
  - Login: POST `/api/login` uses in‑memory user definitions in `login.js` whose credentials resolve from environment variables (`USER_*`, `PASS_*`). Returns `{success,codigo,nombre}`.
- Database access centralized in `db.js` via a MySQL connection pool and exported `query(sql, params, cb)` wrapper adding verbose logging and always releasing connections.
- File uploads: Multer disk storage. General form uploads go to `uploads/`. Requerimientos file uploads go to `uploads/requerimientos` (directory auto-created if missing). Filtration allows only `.jpg,.jpeg,.png,.pdf` for requerimientos.
- Generated codes: `generarCodigoRequerimiento()` pattern: `BRTYYMMDDXXX` where XXX = 3 random alphanumeric chars. Appears in multiple modules; consider refactor to a util to avoid duplication.

## Conventions & Patterns
- Spanish field and variable naming (e.g., `solucion`, `requerimiento`, `detalle`). Keep naming consistent; do not anglicize existing API fields.
- Logging uses emojis to differentiate stages (📦 pool, 🔌 connection, ✅ success, ❌ errors, 📤 insert, 📡 query). Preserve or extend this style when adding similar diagnostics.
- Responses: Success for creation returns `{ success: true, mensaje, codigo }`. Errors generally return `{ error: <mensaje> }` or `{ success:false, error }` for auth. Follow these shapes for new endpoints.
- Grouping: GET requerimientos groups results by `Solución` value into an object keyed by solution; GET descargas groups by `solucion`. Mirror this grouping approach for similar list endpoints.
- Environment-based credentials only; no DB-stored users currently. Avoid adding plaintext credentials in code.

## Environment Variables (expected)
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO
USER_AA1681, PASS_AA1681, USER_AA1832, PASS_AA1832, USER_AD3235, PASS_AD3235, USER_ZZ2006, PASS_ZZ2006
PORT (optional)

## Adding New Endpoints (Example)
- Use a router file; require and mount in `server.js` after middleware.
- Use the shared `db.query` for database ops; always provide parameter array to avoid SQL injection.
- Follow response shapes above and include emoji logging for actions and errors.
- If accepting uploads, mirror `multer` pattern and restrict extensions explicitly.

Example skeleton:
```js
// nuevoRecurso.js
const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', (req,res)=>{
  db.query('SELECT * FROM NUEVA_TABLA', [], (err, rows)=>{
    if (err) return res.status(500).json({ error: 'Error consultando' });
    res.json(rows);
  });
});
module.exports = router;
// in server.js
app.use('/api/nuevo-recurso', require('./nuevoRecurso'));
```

## Build & Run
- Install: `npm install`
- Start (dev/prod): `npm start` (runs `node server.js`). No nodemon configured; add it if hot reload needed.
- Tests: none defined; if adding, keep scripts non-breaking (replace placeholder `test` script when real tests are introduced).

## Safety & Error Handling
- Always release DB connections (handled by pool wrapper). Do not bypass `db.query` unless adding async/Promise variant.
- Keep file type validation when expanding upload support; avoid saving arbitrary executables.
- Do not log sensitive env values; current logging keeps them out—preserve that.

## Refactor Opportunities (incremental, not required)
- Extract duplicated code generator to `util/codigo.js`.
- Implement Promise-based `queryAsync` for cleaner async/await flows.
- Centralize email transporter creation to avoid duplication between form and contacto routes.

## When Unsure
Inspect existing route patterns first; mimic structure, Spanish naming, logging emojis, and response JSON shapes.

---
Provide PRs that stay within these conventions. Ask if introducing auth changes, schema migrations, or external dependencies.
