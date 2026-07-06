# Caja Diaria — memoria del proyecto

App web para **control de caja diaria** de comercios (kioscos, locales, freelancers): registrar
ingresos/egresos por día, ver saldo en vivo, arqueo, préstamos entre empresas, exportar y respaldar.
Idioma: **español rioplatense** (voseo: "registrá", "cerrá", "probá").

## Qué hay en el repo (sitio estático, sin build)

| Archivo | Qué es |
|---|---|
| `index.html` | **La app** (home + app unificados): "Control de Caja Diario · Movimientos" (tema oscuro dorado). Al entrar al sitio ya estás en la caja. Todo el producto vive acá. |
| `app.html` | **Redirección** a la raíz (`location.replace('./')`). Queda por compatibilidad con marcadores/PWA viejos; ya no hay landing separada. |
| `manifest.json` | PWA. `start_url: "./"` → la app instalada abre la caja. `scope: "./"`. Splash oscuro (`#0b0f14`). |
| `sw.js` | Service worker (cache-first). Cachea `./`, `index.html`, `app.html`, manifest e íconos. **Al tocar HTML, subí `CACHE` (`caja-diaria-vN`)** para purgar la caché vieja. |
| `icon-192.png` / `icon-512.png` | Íconos de la PWA. |
| `.github/workflows/deploy-pages.yml` | Deploy automático a GitHub Pages en cada push a `main` (usa `configure-pages` con `enablement:true`). |

- **Sin frameworks, sin build, sin dependencias externas** (excepto EmailJS opcional, cargado on-demand).
  Todo es HTML+CSS+JS inline en un solo archivo por página.
- **Persistencia = `localStorage`** (los datos viven en el navegador del usuario; no hay backend).

## Publicación

- **Sitio en vivo:** https://speranzaemiliano-rk.github.io/caja-diaria/ (home) · `/app.html` (app).
- GitHub Pages está activado vía GitHub Actions. **Cada merge a `main` redepliega solo** — no hay que tocar Settings.
- La app es **PWA instalable** desde el home (Chrome/Edge → Instalar).

## Modelo de datos (claves de localStorage)

- **Contextos** (empresa/proyecto): `caja_contexts_v1` → `[{id, empresa, proyecto}]`. Default: `{id:'default', empresa:'Mi Empresa', proyecto:'Principal'}`.
- Contexto/moneda activos: `caja_active_context_v1`, `caja_active_currency_v1` (`ARS`|`USD`).
- **Días por caja:** `caja_user_days_v2::<ctxId>::<CUR>` → array de días `{iso,date,wd,si,sf,ing,egr,dif,fis,chq,movs:[{imp,cpt,ref}], src:'user', ...}` (imp<0 = egreso).
- **Histórico importado (base):** `BASE_SEED` embebido en el código (solo `default`+`ARS`). No se respalda (es estático). `baseForCtx(ctxId,cur)` lo devuelve.
- **Préstamos entre empresas:** `caja_loans_v1` → `[{id,iso,from:{id,empresa,proyecto},to:{...},cur,amount,note}]`. `registerLoan()` genera egreso en origen + ingreso en destino (ref `PRESTAMO#<id>`).
- **Backup por email:** `caja_backup_email_v1`, `caja_backup_enabled_v1`, `caja_backup_last_v1`, `caja_backup_method_v1` (`google`|`emailjs`|`draft`), `caja_backup_url_v1`, `caja_ejs_public/service/template`.

## Funciones clave (todas en `app.html`)

- **Editor de día** (`openEditor`/`saveDay`): "＋ Nuevo día". Incluye una sección **"⇄ Préstamo entre empresas"**:
  al guardar, `registerLoan()` agrega el egreso a ese día y el ingreso a la caja destino. El resumen refleja los préstamos pendientes en vivo. **Sin doble contabilidad.**
- **⬇ Excel** (`downloadExcel`): genera un `.xlsx` real multi-hoja **sin librerías** (ZIP+OOXML a mano: `zipStore`/`buildXlsx`). Hojas: Resumen diario, Movimientos, Préstamos — todas las empresas + histórico.
- **⤓ Respaldo** (`backupBtn` + `importFile`): exporta/importa el respaldo `.json` (re-importable). Formato = `fullBackupPayload()` = `{exportedAt, contexts, data:{ctxId:{ARS,USD}}, loans}`.
- **✉ Backup diario** (`openBackupSettings`): panel/modal con guía in-app. Envía el respaldo diario por email al abrir la app (1×/día). Métodos:
  - **Google Apps Script** (recomendado, sin límite de tamaño): POST `no-cors` a la URL `/exec`; el script del usuario manda el mail con el `.json` adjunto. La guía + el código están dentro del modal.
  - **EmailJS** (alternativo; el plan free limita el tamaño → puede fallar con respaldos grandes).
  - **Borrador manual** (mailto + descarga). Es el fallback si el envío automático falla.

## Convenciones / cómo trabajar acá

- Editar el HTML directamente (no hay build). Mantener el estilo existente (voseo, tema oscuro en la app, claro en el home).
- **Verificar con Playwright** antes de dar por hecho un cambio (es una app de dinero):
  - Servir: `python3 -m http.server 8099` en la raíz del repo.
  - Node + Playwright: el módulo está en `/opt/node22/lib/node_modules` → importar con ruta absoluta
    `import pw from '/opt/node22/lib/node_modules/playwright/index.js'`. Chromium ya está instalado (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`).
  - Sembrar estado por `localStorage` con `addInitScript` antes de `goto`.
  - Para validar `.xlsx`: `pip install openpyxl` y abrirlo.

## Flujo de git / deploy

- Rama de trabajo: **`claude/web-page-artifact-n434pw`**. Base: `main`.
- Ciclo: commit → push a la rama → PR a `main` → merge → **Pages redepliega solo**.
- Si el PR anterior ya está mergeado, reiniciar la rama desde `main` (`git reset --hard origin/main`) y seguir con el cambio nuevo.
