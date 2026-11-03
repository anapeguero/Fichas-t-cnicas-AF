# Catálogo Técnico de Equipos — Activos Fijos

Prototipo funcional en HTML, CSS y JavaScript inspirado en la maqueta entregada. Utiliza una paleta azul corporativa, menú lateral, indicadores, filtros, listado de equipos, detalles, estándar por formato, documentos y comparador.

> **IMPORTANTE:** todos los equipos, modelos, proveedores y fechas incluidos son ejemplos de demostración. No representan estándares aprobados ni información real de Grupo Ramos.

## 1. Archivos

```text
Catalogo_Tecnico_AF_GitHub/
├── index.html                   Página principal
├── style.css                    Diseño azul y versión responsive
├── app.js                       Filtros, vistas, navegación y comparador
├── data/
│   ├── catalogo.js              Datos ficticios usados por la demostración
│   └── equipos.json             Copia de los datos de ejemplo de referencia
├── assets/
│   └── equipos/                 8 ilustraciones SVG locales de los activos
├── plantilla/
│   └── Catalogo_Fichas_Tecnicas_AF_Simplificado.xlsx
└── README.md
```

No requiere instalar dependencias, paquetes ni servidores. Abre `index.html` en un navegador para probar el prototipo.

## 2. Subir a GitHub Pages

1. Extraer el ZIP.
2. Crear un repositorio en GitHub, o elegir uno existente.
3. Subir **los archivos y carpetas que están dentro** de `Catalogo_Tecnico_AF_GitHub` a la raíz del repositorio (`index.html`, `style.css`, `app.js`, `data/`, `assets/`, `plantilla/`).
4. En el repositorio, abrir **Settings → Pages**.
5. Si está disponible, elegir **Deploy from a branch**, `main`, `/(root)` y guardar.
6. Abrir la dirección de GitHub Pages que aparezca tras la publicación.

**Seguridad:** GitHub Pages de un repositorio público es visible desde Internet. Este prototipo debe mantenerse con **datos ficticios**. No subir nombres de archivos internos confidenciales, precios, fichas reales, contratos ni tokens de autenticación. Usar GitHub Pages solo si la política corporativa lo permite.

## 3. Usar el Excel de OneDrive corporativo (opción B)

1. Guardar la plantilla (o un Excel maestro equivalente) en OneDrive corporativo.
2. Abrir el Excel en el navegador de Microsoft 365.
3. Comprobar si la organización permite generar una dirección de **inserción/iframe** para usuarios autorizados. No usar una opción de acceso anónimo o «cualquier persona» para documentos privados.
4. Abrir el dashboard y entrar al menú **Excel en OneDrive**.
5. Pulsar **Vincular Excel** y pegar el enlace HTTPS autorizado.
6. Si Microsoft 365 permite la inserción, el libro se mostrará en el visor. Si no, utilizar el botón **Abrir en OneDrive**, que respeta el inicio de sesión y los permisos corporativos.

**No es una integración de API:** un enlace compartido de OneDrive no permite, por sí solo, que un sitio público lea las filas de un Excel privado para poblar el catálogo visual. Microsoft puede bloquear iframes por permisos, políticas de la empresa, cookies de terceros o encabezados de seguridad. No se intenta eludir esas restricciones.

El enlace que pega una persona se almacena en el `localStorage` **de ese navegador**, no en el repositorio. Otros empleados necesitarían configurar su propio enlace autorizado, o recibirlo por un canal corporativo. No colocar enlaces privados en el código publicado.

## 4. Qué funciona ahora

- Búsqueda global y búsqueda en la tabla.
- Filtros por formato, categoría, proveedor y estado.
- Selección de filas y panel lateral de detalle.
- Pestañas Resumen, Especificaciones, Ficha técnica e Historial.
- Matriz de estándar por formato.
- Listado de documentos con botón para abrir el PDF cuando exista enlace.
- Secciones Fichas técnicas, Estándares por formato, Proveedores, Comparador, Documentos y Excel en OneDrive.
- Comparación de hasta dos equipos.
- Adaptación a pantallas medianas y teléfonos.

Los documentos de la demostración no contienen enlaces, por lo que sus botones muestran un aviso hasta que se configuren. Las ilustraciones son SVG creados para el prototipo, sin imágenes de marcas comerciales.

## 5. Siguiente fase: catálogo dinámico con datos privados

Para que **las tarjetas y filtros personalizados** se actualicen por sí solos desde OneDrive empresarial, se requiere un mecanismo de lectura autorizado (por ejemplo, una aplicación Microsoft 365 aprobada), que puede necesitar participación de TI. La opción B de este proyecto **visualiza el propio Excel** y sí permite ver los cambios guardados por Compras dentro del visor de Microsoft 365, cuando la inserción está habilitada; no sincroniza automáticamente `catalogo.js`.

Si solo se necesita el catálogo gráfico actualizado sin esa conexión, se podría añadir una carga local de Excel a través del navegador, de forma que los datos no se publiquen en GitHub.

## 6. Personalizar estilos

Los colores están definidos al inicio de `style.css`:

- `--navy`: azul profundo del menú lateral
- `--blue`: azul principal
- `--blue-bright`: azul de acento
- `--blue-light`: fondos azules claros

Son **aproximaciones visuales** a la identidad azul de Grupo Ramos, no códigos hexadecimales oficiales verificados de un manual de marca.

---

**Prototipo para evaluación interna de diseño.** Antes de su utilización corporativa, confirmar políticas de seguridad, permisos y publicación.
