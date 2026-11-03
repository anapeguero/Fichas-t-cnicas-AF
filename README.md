# Catálogo Técnico de Activos Fijos — Azul

Dashboard de consulta pública (GitHub Pages) alimentado directamente desde **un único archivo Excel**: `data/catalogo.xlsx`. El diseño conserva el menú, filtros, tabla, detalle del equipo, matriz por formato y documentos asociados.

> **SEGURIDAD:** Un sitio GitHub Pages público no sirve para datos corporativos confidenciales. Cualquier persona en Internet puede descargar el Excel y las fotografías subidas al repositorio. Usar solo contenido cuya publicación esté autorizada. Los PDF privados deben permanecer en OneDrive con permisos corporativos; los enlaces no conceden acceso por sí solos. La contraseña de GitHub controla quién modifica el repositorio; una contraseña en HTML no protege la edición.

## 1. Publicar el dashboard por primera vez

1. Extrae el ZIP.
2. Sube **todo el contenido de esta carpeta** a la raíz de tu repositorio GitHub (index.html debe quedar en la raíz).
3. En GitHub, `Settings → Pages → Build and deployment → Deploy from a branch`, selecciona `main` y `/(root)`.
4. Abre la URL de Pages que te indique GitHub. Los datos actuales son ejemplos ilustrativos, NO estándares de Grupo Ramos.

## 2. Actualizar únicamente el Excel

1. Descarga `data/catalogo.xlsx` o edita tu copia del archivo maestro con Excel.
2. En la hoja **Equipos** agrega/actualiza filas y conserva los títulos de las columnas.
3. Guarda el archivo como `.xlsx` (Excel, no CSV), con el nombre exacto **catalogo.xlsx**.
4. En GitHub entra a `data/`, elige `Add file → Upload files`, selecciona el archivo actualizado **con el mismo nombre** y confirma `Commit changes` (GitHub pedirá permiso y puede solicitar confirmar reemplazo).
5. Cuando termine la publicación de Pages, recarga la página. La tabla, los filtros, los KPIs y las fichas cambiarán automáticamente según el Excel. No necesitas modificar JS/HTML.

**Importante:** en algunos repositorios con políticas de ramas, es posible que GitHub requiera pull request o permisos adicionales para sobrescribir archivos. No modifica los controles de acceso de tu empresa.

## 3. Dónde colocar las fotos

- Carpeta: `assets/fotos/`
- Ejemplo: subes `assets/fotos/rack-carrier.jpg` y, en el Excel, pones `rack-carrier.jpg` en la columna **Foto** del equipo correspondiente.
- Formatos aceptados: JPG, JPEG, PNG, WEBP, GIF o SVG. Usa preferiblemente JPG/PNG/WEBP. Los nombres distinguen mayúsculas/minúsculas en GitHub Pages.
- También se admite una **URL HTTPS pública y directa de imagen** en la columna Foto. Enlaces de vista previa de OneDrive protegidos normalmente no sirven como fotos dentro de la página.
- Si falta una foto o la ruta no es válida, el sitio muestra un marcador gráfico `assets/fotos/sin-foto.svg`.
- Se incluyen ilustraciones SVG de muestra; sustitúyelas por tus fotos reales cuando las tengas.

## 4. Fichas PDF

- Pega el **enlace HTTPS** de cada ficha en la columna **Ficha técnica** del Excel.
- Si el PDF está en OneDrive corporativo, el enlace se abrirá en la plataforma de Microsoft y respetará el acceso del usuario. No necesitas copiar el PDF a GitHub.
- Para PDF autorizados para publicación pública, es posible cargarlos en `assets/fichas/` y poner su nombre `archivo.pdf` en el Excel. **Nunca subas PDFs internos a GitHub Pages público.**
- La columna **Otros documentos** admite un enlace HTTPS adicional o el nombre de un PDF público local.

## 5. Campos de Excel

Una hoja llamada `Equipos`, con estos encabezados:

| Columna | Obligatoria | Ejemplo |
|---|---|---|
| Código | Sí | AF-RF-001 |
| Equipo | Sí | Rack refrigerado |
| Categoría | Recomendado | Refrigeración |
| Formatos | Recomendado | Sirena, Aprezio |
| Proveedor | Opcional | Proveedor aprobado |
| Marca | Opcional | Marca XYZ |
| Modelo | Opcional | Modelo ABC |
| Estado | Opcional | Estándar / En revisión / Obsoleto |
| Foto | Opcional | rack-carrier.jpg |
| Ficha técnica | Recomendado | https://... |
| Otros documentos | Opcional | https://... |
| Última actualización | Opcional | 2026-11-02 |
| Observaciones | Opcional | Nota breve |

Mantén los códigos únicos. Si un equipo tiene modelos diferentes por formato, usa dos códigos de equipo diferentes. Separa los formatos por coma, punto y coma o barra vertical.

## 6. ¿Quién puede cambiar los datos?

- **Visitantes:** abren el sitio y pueden consultar los datos publicados. No pueden cambiarlos.
- **Editores autorizados:** la cuenta de GitHub del dueño del repositorio y los colaboradores con acceso de escritura. Deben iniciar sesión en GitHub para subir/editar archivos.
- Para invitar editores: `Settings → Collaborators and teams` (la ubicación varía si el repositorio pertenece a una organización).
- No existe una contraseña única para editar desde la página; lograr eso de forma segura requiere autenticación con servidor/servicio de identidad. No colocar contraseñas en HTML, JavaScript o Excel.
- El botón **Editar catálogo** abre el repositorio, no un editor público. Si no aparece, edita el campo `repoUrl` en `config.js` con la URL de GitHub (una sola vez). En sitios `usuario.github.io/proyecto/`, intenta reconocer la URL de GitHub automáticamente.

## 7. Estructura del proyecto

```
index.html                  Portal y presentación
style.css                   Diseño azul corporativo
app.js                      Filtros, fichas, comparador y navegación
xlsx-reader.js              Lector XLSX local (sin CDN ni API)
config.js                   URL de repositorio opcional
data/catalogo.xlsx          ÚNICO EXCEL para datos
assets/fotos/               Imágenes de equipos
assets/fichas/              Solo PDFs públicos autorizados (opcional)
assets/equipos/             Ilustraciones originales de referencia
README.md                   Estas instrucciones
```

**Compatibilidad:** funciona en versiones recientes de Chrome, Edge y otros navegadores con soporte `DecompressionStream('deflate-raw')`. Requiere estar publicado en un servidor web como GitHub Pages: por seguridad del navegador, `index.html` abierto como `file://` puede no permitir cargar el Excel. El lector incluye valores y vínculos HTTPS del XLSX; no ejecuta macros ni cálculos de Excel.
