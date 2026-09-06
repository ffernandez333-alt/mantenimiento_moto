# Mis motos

Aplicación web responsive para gestionar el libro de vida y el mantenimiento de una KTM 250 EXC TPI 2021.

## Estado actual

La primera versión es un frontend estático funcional. Incluye:

- Centro de control unificado con avisos, tareas, actividad reciente, horas reales, kilómetros, gastos y próximos trabajos.
- Libro de vida con línea temporal y formulario para registrar eventos.
- Plan de mantenimiento basado en la tabla KTM: intervalos iniciales, deportivos, 20, 40 y 80 horas, y revisiones anuales/cuatrienales.
- Botón para actualizar el plan de cada moto mediante un PDF de mantenimiento periódico.
- Lista de tareas dinámica por intervalo, con estados "Hecha" y "No aplica", notas por tarea y modo taller a pantalla completa.
- Sesiones de mantenimiento con fecha y lecturas del marcador editables, opción de continuar revisiones en varios días y botón de reinicio con confirmación.
- Al completar todas las tareas, el mantenimiento se registra automáticamente en el Libro de vida; los mantenimientos no se crean desde el formulario general de eventos.
- Las revisiones iniciadas aparecen como «En curso» en el Libro de vida y se pueden continuar desde allí con un acceso directo al modo taller.
- Los eventos y cada tarea de mantenimiento admiten archivos, fotos y vídeos, incluida la captura desde la cámara del dispositivo.
- Selector de motos con botón «Añadir moto»; cada moto mantiene separados su ficha, historial y mantenimientos.
- Identificación de la moto seleccionada en cada vista y en modo taller, con nombre, año y matrícula o ID. «Mis motos» muestra una ficha separada por moto y permite seleccionarla. Al cambiar de moto se conserva la vista actual.
- El Centro de control se actualiza al cambiar de moto y muestra sus datos, tareas y actividad reciente sin mezclar información.
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

## Cálculo de revisiones

Cada intervalo por horas usa la última revisión completada de ese mismo intervalo, con fecha válida no futura y horas reales explícitas. La siguiente referencia es `horas reales de la revisión + intervalo`. Una revisión de 20 h completada a las 213 h deja la siguiente en 233 h. Una revisión de 40 h no reinicia automáticamente la de 20 h.

Los avisos permiten planificarse sin bloquear salidas: al llegar a la referencia o retrasarse hasta un 25 % del intervalo, el aviso es ámbar; al superar ese margen, rojo. En 20 h el margen es 5 h y en 40 h es 10 h. El margen no desplaza la referencia y representa una preferencia de planificación del usuario.

Las revisiones en curso no reinician el plazo. Sin historial válido se muestra «Sin referencia»; si las horas actuales son inferiores a las de la revisión, se pide revisar las lecturas. No se deducen horas reales de notas ni se usan lecturas de marcador como si fueran reales. Del historial antiguo solo se reconocen descripciones explícitas de intervalo (revisión de 20, 40 u 80 horas) con fecha y horas reales guardadas.

Cada sesión conserva sus propias horas/km reales, editables en el modo taller. «Comenzar una nueva revisión» conserva la anterior en el libro de vida y abre una lista vacía. Las revisiones anteriores pueden consultarse sin abrir por error la sesión actual.

En el Libro de vida, cada evento tiene una papelera. La aplicación pide confirmación antes de eliminarlo. Al borrar una revisión de mantenimiento también elimina su sesión y sus tareas guardadas, para que desaparezca del ciclo de mantenimiento y pueda registrarse de nuevo si fue un error.

La vista de Mantenimiento permite iniciar una revisión nueva seleccionando uno o varios intervalos. Si se combinan, las tareas se unen sin duplicados y se conserva una sesión propia para poder continuarla. El plan visible excluye las revisiones iniciales, el intervalo de 10 horas y los intervalos deportivos o de competición; siguen disponibles solo los intervalos base de 20, 40 y 80 horas y las revisiones por meses.

En la ficha de cada revisión se introducen la fecha y las lecturas del marcador. Las horas y kilómetros reales se calculan automáticamente a partir del desplazamiento del marcador y se pueden corregir manualmente antes de guardar.

Pruebas: `node --test maintenance-schedule.test.cjs backup.test.cjs`.

## Guardar y restaurar copias

En **Mis motos → Copia de seguridad**, pulsa **Guardar copia** para descargar un archivo JSON con todas las motos, historiales, planes personalizados, tareas, revisiones en curso, fotos y adjuntos guardados. Conserva el archivo en un lugar privado.

Para recuperar los datos en este navegador u otro dispositivo, abre la aplicación, pulsa **Restaurar copia** y selecciona el archivo. La aplicación valida su formato y muestra la fecha y las motos antes de pedir confirmación. La restauración sustituye los datos de todas las motos; guarda primero una copia del estado actual. Si falta espacio durante el guardado, se recupera el estado anterior. Los cambios de formularios que aún no hayas guardado no se incluyen.

La copia es manual y no requiere conexión. El informe PDF del Libro de vida sigue disponible por separado y no sirve para restaurar datos.

Pruebas de copia y restauración: `node --test backup.test.cjs`.

## Siguiente fase

Añadir historial detallado de cambios de marcador y completar la gestión de documentos.
