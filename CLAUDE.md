# Caja Diaria — memoria del proyecto

App web para **control de caja diaria** de comercios (kioscos, locales, freelancers): registrar
ingresos/egresos por día, ver saldo en vivo, arqueo, préstamos entre empresas, exportar y respaldar.
Idioma: **español rioplatense** (voseo: "registrá", "cerrá", "probá").

## Qué hay en el repo (sitio estático, sin build)

| Archivo | Qué es |
|---|---|
| `index.html` | **La portada** (landing, página aparte): estilo **Google-clean** (blanco, azul `#1a73e8`, Roboto), con preview de la caja y botón "Abrir mi caja" → `app.html`. Registra el SW. NO tiene la app embebida. |
| `app.html` | **La caja** (la app): "Control de Caja Diario · Movimientos". Reestilizada a **Google-clean claro** (blanco/gris `#f8f9fa`, azul `#1a73e8`, verde `#188038`/rojo `#d93025`, Roboto + Roboto Mono). El reskin se hizo cambiando `:root` + un bloque de overrides al final del `<style>` (conservando toda la estructura/JS). El logo del sidebar (`a.brand`) vuelve a la portada. |
| `manifest.json` | PWA. `start_url: "./"` → la app instalada abre la **portada**. `scope: "./"`. Splash blanco (`#ffffff`). |
| `sw.js` | Service worker. Cachea `./`, `index.html`, `app.html`, manifest e íconos. **Al tocar HTML, subí `CACHE` (`caja-diaria-vN`)** para purgar la caché vieja. |
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
- **Días por caja:** `caja_user_days_v2::<ctxId>::<CUR>` → array de días `{iso,date,wd,si,sf,ing,egr,dif,fis,caja:[números],chq,credSi,cred,credAdj,credMovs:[{imp,note}],movs:[{imp,cpt,ref}], src:'user', ...}` (imp<0 = egreso). `fis` = suma de `caja` (partes del conteo físico, cargadas por separado en el editor).
- **Histórico importado (base):** `BASE_SEED` embebido en el código (solo `default`+`ARS`). No se respalda (es estático). `baseForCtx(ctxId,cur)` lo devuelve.
- **Préstamos entre empresas:** `caja_loans_v1` → `[{id,iso,from:{id,empresa,proyecto},to:{...},cur,amount,note}]`. `registerLoan()` genera egreso en origen + ingreso en destino (ref `PRESTAMO#<id>`).
- **Backup por email:** `caja_backup_email_v1`, `caja_backup_enabled_v1`, `caja_backup_last_v1`, `caja_backup_method_v1` (`google`|`emailjs`|`draft`), `caja_backup_url_v1`, `caja_ejs_public/service/template`.

## Funciones clave (todas en `app.html`)

- **Editor de día** (`openEditor`/`saveDay`): "＋ Nuevo día". Incluye una sección **"⇄ Préstamo entre empresas"**:
  al guardar, `registerLoan()` agrega el egreso a ese día y el ingreso a la caja destino. El resumen refleja los préstamos pendientes en vivo. **Sin doble contabilidad.**
- **Vista "Préstamos" — editar/eliminar** (`renderLoanTable`): cada fila del "Historial de préstamos" tiene iconos **✎/🗑** (`.rowact`, igual patrón que días/movimientos). `deleteLoan(id)` y `editLoan(id)` usan `removeLoanMovements(loan)` para encontrar y quitar los 2 movimientos ligados (por `ref==='PRESTAMO#'+id`, en la caja origen y destino, buscando en `caja_user_days_v2::<ctxId>::<cur>` — **no** solo en la caja activa) y recalcular ese día (`ing`/`egr`/`nmov`/`sf`/`cascadeChain`) en ambos contextos — así no quedan movimientos huérfanos. `editLoan(id)` precarga el formulario de arriba (origen/destino/moneda/importe/nota/fecha) con `editingLoanId` seteado, cambia el botón a **"✓ Guardar cambios"** y agrega un **"Cancelar edición"**; al guardar, el handler de `loanSubmit` revierte el préstamo viejo y llama `registerLoan()` de nuevo con los valores nuevos (queda con un id nuevo, no importa: el historial no depende del id para mostrarse). `deleteLoan(id)` ahora sí revierte los movimientos (antes solo borraba el registro y los dejaba huérfanos).
- **Acciones por fila** (`.rowact` ✎/🗑): en "Movimientos diarios" (días) y "Buscar movimientos" (asientos), cada fila `src:'user'` muestra editar (`editDay`) y eliminar (`deleteDay` para días, `deleteMov(iso,idx)` para un movimiento — recalcula ing/egr/sf/nmov/dif y `cascadeChain`). Los días/movimientos del histórico importado (`src:'base'`) **no** muestran iconos (read-only). Los botones usan `event.stopPropagation()` para no disparar el modal de detalle de la fila.
- **Resumen (v-dash) = el día**: KPIs de Saldo inicial/Ingresos del día/Egresos del día/Saldo final (`renderKpis`) + panel "Movimientos del día" (`renderDayMovs`) con la tabla de movimientos y botones **"＋ Agregar movimiento"** (alta rápida sin abrir el editor completo: `openQuickAdd`/`saveQuickMov`, panel Tipo/Concepto/Importe inline) y **"✎ Editar día"** (`editDay`) — ambos solo visibles si `last.src==='user'`. Los 4 gráficos/paneles (Evolución del saldo, Composición, Diferencias de caja, Flujo mensual) viven en la vista **Análisis**, junto con sus KPIs propios (Ingresos/Egresos totales, Flujo neto, Descuadres, Movimientos, Principales conceptos, Actividad por día de semana, Resumen mensual).
- **Selección con suma neta** (`.selbar`, botón `.btn.on`): botón **"☑ Seleccionar"** en el Resumen (`daySelBtn`/`toggleDaySelMode`, junto a "＋ Agregar movimiento") y en "Buscar movimientos" (`movSelBtn`/`toggleMovSelMode`). Agrega una columna de checkboxes (`.selchk`) a la tabla; tildar movimientos muestra una barra celeste con "N seleccionado(s) · Suma neta: $X" (con signo, ingresos suman/egresos restan) y un link "Limpiar selección". En Buscar movimientos la clave de cada ítem es `iso#índice` (`_movByKey`), y al filtrar la búsqueda la selección se recorta sola a lo que sigue visible. Disponible también en días de solo lectura (histórico), ya que sumar no modifica nada — a diferencia de Agregar/Editar, que siguen restringidos a `src==='user'`.
- **Arqueo del día**: "Caja real (conteo físico)" se carga **por partes** (igual patrón que créditos, pero sin concepto): el editor tiene una lista (`edState.fisMovs`, `#fisMvList`/`renderFisMovRows`/`blankFisMov`) con botón **"＋ Agregar parte del conteo"** — cada fila es solo un importe (sin toggle +/-, sin nota), pensado para cargar el conteo en varias tandas (cajones, arqueos parciales) sin perder lo ya cargado. "Total contado" se previsualiza en vivo (`recalcFis`, suma todas las filas). Al guardar, `saveDay` arma `d.caja` = array de partes y `d.fis` = su suma (o `null` si no se cargó ninguna parte). El detalle del día (`openDay`) sigue mostrando el desglose **"Desglose caja real (conteo físico)"** con un chip por parte + Σ total (esto ya existía en `d.caja`/`openDay`, antes nunca se llenaba desde el editor — ahora sí). Compat: un día viejo con `fis` como número suelto (sin `caja` itemizada) se muestra como **una parte ya cargada** al reabrir para editar, no se pierde nada.
- **"Cheques / valores"** sigue siendo un campo único (no itemizado).
- **"Créditos a cobrar"** — es un **saldo acumulado día a día** (como la caja), no un número suelto. El editor muestra "Saldo anterior" (`d.credSi`, heredado del día previo) y una **lista de ajustes** (`edState.credMovs`, `#credMvList`/`renderCredMovRows`/`blankCredMov`) con botón **"＋ Agregar ajuste de crédito"**: cada fila tiene su propio toggle +/-, un campo de **nombre/concepto** ("de quién es", `cm.note`) e importe (igual que los movimientos de caja), así se pueden cargar **varios ajustes el mismo día** sin que uno reemplace al otro. "Nuevo saldo de créditos" se previsualiza en vivo (`recalcCredit`, suma todas las filas). Al guardar, `saveDay` arma `d.credMovs` (itemizado, con `note`) y `d.credAdj` = suma de esas filas. El detalle del día (`openDay`) muestra un desglose **"Detalle de créditos del día"** listando cada `note` con su importe (signo +/-), para poder ver después de quién es cada crédito. `cascadeChain()` (además de `si`/`sf` de la caja) encadena `credSi`/`cred` a través de todos los días reales usando `credAdj` — corre en cada `saveDay`/`deleteDay`/`deleteMov`/préstamo, y también al inicio de `recompute()` (o sea en cada render) para que quede siempre consistente sin depender de haber guardado algo. Compat: si un día quedó con el `cred` plano de una versión anterior (sin `credAdj`), se trata como el ajuste de ese día la primera vez que se recalcula la cadena — no se pierde nada.
- **Los créditos cuentan como efectivo en el arqueo**: `dif` (Diferencia de caja) ya **no** es solo `sf - fis` — es `sf - (fis + cred)` (créditos sumados al conteo físico, como si fueran plata en mano), a diferencia de `chq` que sigue siendo solo informativo y no entra en el cálculo. `cascadeChain()` es la única fuente de verdad de `dif` (lo recalcula siempre, junto con `credSi`/`cred`, para todos los días reales en cada pasada — los sitios que guardan un día calculan un `dif` provisorio con la fórmula vieja, pero `cascadeChain()` lo corrige inmediatamente después). El modal de detalle (`openDay`) muestra una línea extra **"Total contado (caja + créditos)"** antes de "Diferencia de caja" para que se entienda de dónde sale la comparación.
- **⬇ Excel** (`downloadExcel`): genera un `.xlsx` real multi-hoja **sin librerías** (ZIP+OOXML a mano: `zipStore`/`buildXlsx`). Hojas: Resumen diario, Movimientos, Préstamos — todas las empresas + histórico.
- **⤓ Respaldo** (`backupBtn` + `importFile`): exporta/importa el respaldo `.json` (re-importable). Formato = `fullBackupPayload()` = `{exportedAt, contexts, data:{ctxId:{ARS,USD}}, loans}`.
- **✉ Backup diario** (`openBackupSettings`): panel/modal con guía in-app. Envía el respaldo diario por email al abrir la app (1×/día). Métodos:
  - **Google Apps Script** (recomendado, sin límite de tamaño): POST `no-cors` a la URL `/exec`; el script del usuario manda el mail con el `.json` adjunto. La guía + el código están dentro del modal.
  - **EmailJS** (alternativo; el plan free limita el tamaño → puede fallar con respaldos grandes).
  - **Borrador manual** (mailto + descarga). Es el fallback si el envío automático falla.
- **☁ Nube** (`openSyncSettings`/`startSync`): **sincronización entre dispositivos** con **Firebase Firestore** real (proyecto `rk-cajadiaria-5-6`, SDK compat por CDN, auth anónima). Doc `cajas/{codigo}` = `fullBackupPayload()`. `onSnapshot` baja cambios → `applyRemote()` los escribe en localStorage y re-renderiza; un `localStorage.setItem` interceptado dispara `schedulePush()` (debounce 900ms). El eco propio se ignora por `updatedBy===deviceId()`.
  - **Auto-conexión (decisión del usuario, riesgo aceptado):** `DEFAULT_FIREBASE_CONFIG` y `DEFAULT_SYNC_CODE` quedan **embebidos en el código** (`index.html`). `ensureDefaultSync()` corre una sola vez por navegador (marca `caja_sync_autoinit_v1`) y, si no hay config/código ya guardados, los completa con los valores fijos y activa la sync sola — así **cualquier navegador que abra el sitio ya comparte la misma caja**, sin pegar nada. El `firebaseConfig` no es secreto (va en el cliente); el "código de caja" fijo SÍ implica que cualquiera que vea el código fuente (el repo es público) podría conectarse a esta caja — trade-off elegido explícitamente por el usuario a cambio de cero fricción. Si el usuario desconecta manualmente (☁ Nube → Desconectar), `caja_sync_autoinit_v1` evita que se vuelva a auto-activar solo. El panel permite pisar el código/config con uno propio si se quiere separar datos.
  - Claves: `caja_sync_cfg_v1`, `caja_sync_code_v1`, `caja_sync_enabled_v1`, `caja_device_id_v1`, `caja_sync_autoinit_v1`.
  - **Estado: verificado en producción** (Firebase real: Auth Anónimo + Reglas de Firestore + lectura/escritura/tiempo real probados end-to-end; el usuario ya conectó un dispositivo real con éxito).

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
