# Caja Diaria — apps nativas (Google Play / App Store)

Wrapper nativo con **Capacitor** para poder subir la misma app web (`www/`) a Google Play y
al App Store, sin reescribirla. La web en sí sigue siendo estática, sin build, tal como
siempre — Capacitor solo la empaqueta adentro de un proyecto Android/iOS nativo.

## Qué se armó

- `www/` — el sitio de siempre (`index.html`, `app.html`, `manifest.json`, `sw.js`, íconos)
  se movió acá desde la raíz del repo, sin tocar una sola línea de su contenido. Sigue
  sirviéndose igual en GitHub Pages (el workflow ahora apunta a `www/` en vez de `.`).
- `capacitor.config.json` — `appId: com.cajadiaria.app`, `appName: Caja Diaria`,
  `webDir: www`. **El `appId` no se puede cambiar después de la primera publicación en
  cada tienda** — confirmalo antes de publicar (si preferís otro, como algo con tu propio
  dominio, cambialo en este archivo antes de compilar nada).
- `android/` — proyecto nativo de Android generado con `npx cap add android`. **Se probó
  en este entorno y compila un APK debug real y funcional** (`com.cajadiaria.app`,
  label "Caja Diaria", verificado con `aapt dump badging`).
- `ios/` — proyecto nativo de iOS (Xcode) generado con `npx cap add ios`, usa Swift
  Package Manager (no hace falta CocoaPods). **No se pudo compilar en este entorno**
  (hace falta Xcode, que solo corre en Mac) — se verificó que el `Info.plist` y el
  `.pbxproj` son válidos, pero la primera compilación real va a ser la que hagas vos en
  Xcode.
- Íconos y splash screens para ambas plataformas, generados con `npx capacitor-assets
  generate` a partir de `assets/icon.png` (copia de `www/icon-512.png`, 512×512).
  **Recomendado**: antes de publicar de verdad, reemplazá `assets/icon.png` por una
  versión de mayor resolución (ideal 1024×1024) y volvé a correr el comando — la fuente
  actual da un resultado aceptable pero no perfecto al verse escalada en los tamaños más
  grandes (ícono de la App Store, por ejemplo).
- `.gitignore` — excluye `node_modules/`, `android/local.properties` (específico de cada
  máquina), y las carpetas de build (`android/build/`, `android/.gradle/`,
  `ios/App/build/`, etc.) — nunca se comitean, se regeneran solas al compilar.

## Cómo mantenerlo sincronizado con la web

Cada vez que cambia algo en `www/` (los PRs normales de la app siguen funcionando
exactamente igual), para que el cambio llegue a las apps nativas hay que correr:

```
npx cap sync
```

Esto copia `www/` adentro de `android/app/src/main/assets/public` y
`ios/App/App/public`. **Esto no pasa solo** — si publicás una versión nueva en las
tiendas, acordate de correr `cap sync` antes de recompilar, si no vas a estar subiendo
una versión vieja de la app.

## Para publicar en Google Play

1. Instalá [Android Studio](https://developer.android.com/studio) (trae el SDK incluido)
   — o usá `sdkmanager` por línea de comandos como se hizo acá.
2. `npx cap sync android`
3. Abrí `android/` en Android Studio, o generá el paquete por consola:
   `cd android && ./gradlew bundleRelease` (Google Play pide un `.aab`, no un `.apk`).
4. Generá una clave de firma (una sola vez, **guardala en un lugar seguro** — si la
   perdés no vas a poder subir más actualizaciones de esta app):
   `keytool -genkeypair -v -keystore caja-diaria.keystore -alias caja-diaria -keyalg RSA -keysize 2048 -validity 10000`
5. Configurá la firma en Android Studio (Build → Generate Signed Bundle / APK) o en
   `android/app/build.gradle`.
6. Creá una cuenta en [Google Play Console](https://play.google.com/console) (pago único
   de USD 25), armá la ficha de la app (podés arrancar con `www/screenshot-1.png` y
   `www/screenshot-2.png`, y la descripción de `www/manifest.json`), subí el `.aab` y
   mandala a revisión.

## Para publicar en el App Store

1. Necesitás una **Mac con Xcode** — no hay forma de evitarlo, Apple no permite compilar
   ni firmar apps de iOS desde Linux.
2. `npx cap sync ios`
3. `npx cap open ios` (abre el proyecto en Xcode).
4. En Xcode: Signing & Capabilities → elegí tu equipo de Apple Developer (hace falta una
   cuenta paga de [Apple Developer Program](https://developer.apple.com/programs/), USD
   99/año).
5. Product → Archive, y subilo a App Store Connect (desde el Organizer de Xcode, o con
   la app Transporter).
6. Armá la ficha en [App Store Connect](https://appstoreconnect.apple.com), completá
   metadata/capturas, y mandala a revisión.

### ⚠️ Riesgo real de rechazo en Apple

La guideline 4.2 de Apple ("Minimum Functionality") rechaza apps que son básicamente un
sitio web envuelto, sin nada nativo de verdad. Caja Diaria hoy no usa ninguna capacidad
nativa del teléfono (todo corre en el WebView, como en el navegador) — hay una
posibilidad real de que Apple la rechace en la primera revisión. Si eso pasa, algunas
opciones para sumar funcionalidad nativa genuina con Capacitor (no implementadas todavía,
quedan para una vuelta futura si hace falta):

- Notificaciones locales nativas para el recordatorio de backup diario
  (`@capacitor/local-notifications`).
- Face ID / Touch ID para desbloquear el detalle de créditos protegido, en vez de (o
  además de) la clave actual (`@capacitor/biometric-auth` o similar).

Google Play es bastante más permisivo con este tipo de apps (TWA/wrappers), así que ese
lado tiene mucho menos riesgo de rechazo.

## Qué NO se hizo (y por qué)

- **No se compiló ni firmó ningún build de release** — necesita las claves/certificados
  del propio desarrollador, que no existen en este entorno.
- **No se creó ninguna cuenta de desarrollador** (Google Play Console, Apple Developer
  Program) — son cuentas pagas, personales, no se pueden crear en tu nombre.
- **No se compiló el proyecto de iOS** — necesita Xcode en una Mac real.
- **No se subió nada a ninguna tienda** — la sumisión final es manual, a través de Play
  Console / App Store Connect, con tus propias credenciales.
