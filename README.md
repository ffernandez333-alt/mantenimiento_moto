# Mis motos

Aplicación web responsive para gestionar el libro de vida y el mantenimiento de una KTM 250 EXC TPI 2021.

## Estado actual

La primera versión es un frontend estático funcional. Incluye:

- Página Hoy con avisos, tareas y actividad reciente.
- Dashboard con horas reales, kilómetros, gastos y próximos trabajos.
- Libro de vida con línea temporal y formulario para registrar eventos.
- Plan de mantenimiento de 20 y 40 horas.
- Componentes con estado y vida estimada.
- Documentos y gastos.
- Banco técnico.
- Navegación responsive para móvil y escritorio.
- Guardado local de las tareas completadas mediante `localStorage`.

## Ejecutar en local

Abre `index.html` en un navegador o sirve esta carpeta con cualquier servidor estático. No requiere instalación de dependencias.

## Publicar con Cloudflare Pages

1. Crea un repositorio en GitHub y sube esta carpeta.
2. En Cloudflare Pages, selecciona **Create a project** y conecta el repositorio.
3. Usa la carpeta raíz como directorio de publicación.
4. No añadas comando de build: la aplicación es HTML, CSS y JavaScript estático.

La versión actual no usa cuentas, base de datos ni almacenamiento remoto. Para guardar datos entre dispositivos habrá que añadir autenticación, base de datos y almacenamiento de archivos; esas decisiones quedan pendientes según el uso final.

## Siguiente fase

Añadir ficha editable de la moto, eventos persistentes, cambios de marcador con cálculo de horas y kilómetros reales, subida de documentos y exportación de datos.
