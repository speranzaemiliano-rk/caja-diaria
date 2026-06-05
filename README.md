# Control de Caja Diaria 💰

Aplicación web para registrar y gestionar movimientos de caja diarios. Los datos se guardan en el navegador (localStorage) y pueden exportarse/importarse.

## Características

✅ Registro de movimientos diarios (ingresos/egresos)  
✅ Conversión de moneda (ARS/USD)  
✅ Gráfico de saldo acumulado (últimos 30 días)  
✅ Dos vistas: línea de tiempo y por mes  
✅ Búsqueda de movimientos  
✅ Exportar/importar respaldos (JSON)  
✅ Diseño oscuro moderno y responsivo  
✅ Sin conexión a internet (funciona completamente offline)  

## Instalación en GitHub Pages

### Opción 1: Subir archivos directamente en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **"Add file"** → **"Upload files"**
3. Sube el archivo `index.html`
4. Click en **"Commit changes"**
5. Ve a **Settings** → **Pages** y verifica que esté activo
6. Accede a: `https://tu-usuario.github.io/`

### Opción 2: Usar Git desde terminal

```bash
# Clonar tu repositorio
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo

# Copiar el archivo
cp index.html .

# Agregar, hacer commit y subir
git add index.html
git commit -m "Agregar control de caja diaria"
git push origin main
```

### Opción 3: GitHub Desktop

1. Abre GitHub Desktop
2. Selecciona tu repositorio
3. Copia `index.html` a la carpeta del repositorio
4. GitHub Desktop mostrará el cambio
5. Click en **"Commit to main"**
6. Click en **"Push origin"**

## Uso

### Crear un nuevo día
1. Click en **"+ Nuevo día"**
2. Selecciona la fecha
3. Ingresa saldo inicial
4. Agrega movimientos (ingresos/egresos)
5. Puedes usar ARS o USD (si usas USD especifica el tipo de cambio)
6. Opcionalmente: ingresa conteo físico de caja
7. Click en **"Guardar día"**

### Ver detalles
- **Línea de tiempo**: click en cualquier día para verlo en detalle
- **Por mes**: expande/colapsa meses para ver todos los días

### Buscar
Usa la barra de búsqueda para filtrar por:
- Concepto del movimiento
- Referencia
- Fecha

### Respaldo de datos
- Click en **"💾 Respaldo"**
- **Exportar**: descarga un archivo JSON con todos tus datos
- **Importar**: carga un respaldo anterior

## Requisitos técnicos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Soporte para localStorage
- JavaScript habilitado

## Almacenamiento de datos

- ✅ Los datos se guardan **localmente en tu navegador**
- ✅ **No se envía información a servidores**
- ⚠️ Si borras cache/cookies se pierden los datos (usa respaldos)
- ✅ Puedes usar en múltiples dispositivos importando respaldos

## Solución de problemas

**"El sitio no se ve"**
- Verifica que el archivo esté en la raíz del repositorio como `index.html`
- Espera 1-2 minutos a que GitHub publique
- Abre en pestaña incógnito para descartar cache

**"Los datos se perdieron"**
- Los datos se guardan en localStorage del navegador
- Si limpias el cache se pierden
- Siempre mantén respaldos (exporta regularmente)

**"Acceso denegado en GitHub"**
- Verifica que tengas permisos en el repositorio
- Asegúrate de estar autenticado en GitHub

## Características futuras

- Sincronización en la nube
- Gráficos más avanzados
- Categorización de gastos
- Reportes mensuales/anuales

---

**Versión**: 1.0  
**Última actualización**: 2026
