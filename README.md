# Mis motos

Aplicación web responsive para gestionar el libro de vida y el mantenimiento de una KTM 250 EXC TPI 2021.

## Estado actual

La primera versión es un frontend estático funcional. Incluye:

- Página Hoy con avisos, tareas y actividad reciente.
- Dashboard con horas reales, kilómetros, gastos y próximos trabajos.
- Libro de vida con línea temporal y formulario para registrar eventos.
- Plan de mantenimiento basado en la tabla KTM: intervalos iniciales, deportivos, 20, 40 y 80 horas, y revisiones anuales/cuatrienales.
- Botón para actualizar el plan de cada moto mediante un PDF de mantenimiento periódico.
- Lista de tareas dinámica por intervalo, con estados "Hecha" y "No aplica", notas por tarea y modo taller a pantalla completa.
- Sesiones de mantenimiento con fecha y lecturas del marcador editables, opción de continuar revisiones en varios días y botón de reinicio con confirmación.
- Al completar todas las tareas, el mantenimiento se registra automáticamente en el Libro de vida; los mantenimientos no se crean desde el formulario general de eventos.
- Las revisiones iniciadas aparecen como «En curso» en el Libro de vida y se pueden continuar desde allí con un acceso directo al modo taller.
- Los eventos y cada tarea de mantenimiento admiten archivos, fotos y vídeos, incluida la captura desde la cámara del dispositivo.
- Selector de motos con botón «Añadir moto»; cada moto mantiene separados su ficha, historial y mantenimientos.
- La vista Hoy se actualiza al cambiar de moto y muestra sus datos, tareas y actividad reciente sin mezclar información.
- Exportación de un informe PDF con la ficha de la moto, gráfico de horas reales frente al tiempo, marcas de pistón e historial de mantenimientos por horas y kilómetros reales.
- Componentes con estado y vida estimada.
- Documentos y gastos.
- Banco técnico.
- Navegación responsive para móvil y escritorio.
- Guardado local de las tareas completadas mediante `localStorage`.
- Ficha editable de la moto con marca, modelo, año y matrícula/identificador.
- Guardado local de los datos de la ficha mediante `localStorage`.
- Foto por defecto del modelo KTM 250 EXC TPI 2021 y posibilidad de sustituirla desde la ficha.
- Lecturas iniciales separadas para uso real y marcador visible, con soporte para poner el marcador a cero sin perder el acumulado real.
- Libro de vida persistente con salidas, mantenimientos, gastos, documentos y cambios de marcador.
- Registro de horas, kilómetros, coste y notas en cada evento.
- Fecha editable en cada evento, con la fecha actual seleccionada por defecto.
- Las horas y kilómetros del evento se precargan con la lectura actual del marcador y siguen siendo editables.

El PDF del plan se lee en el navegador. La aplicación detecta los intervalos reconocibles y guarda el plan resultante solo para esa moto y ese navegador. El lector PDF se carga desde CDN únicamente cuando se pulsa **Actualizar plan PDF**; si no hay conexión en ese momento, se conserva el plan anterior.

## Ejecutar en local

Abre `index.html` en un navegador o sirve esta carpeta con cualquier servidor estático. No requiere instalación de dependencias.

## Publicar con Cloudflare Pages

1. Crea un repositorio en GitHub y sube esta carpeta.
2. En Cloudflare Pages, selecciona **Create a project** y conecta el repositorio.
3. Usa la carpeta raíz como directorio de publicación.
4. No añadas comando de build: la aplicación es HTML, CSS y JavaScript estático.

La versión actual no usa cuentas, base de datos ni almacenamiento remoto. Para guardar datos entre dispositivos habrá que añadir autenticación, base de datos y almacenamiento de archivos; esas decisiones quedan pendientes según el uso final.

## Siguiente fase

Añadir historial detallado de cambios de marcador, subida de documentos y exportación de datos.
