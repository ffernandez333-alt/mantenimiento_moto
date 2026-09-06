# Brief de implementación · Mis motos

## Contexto y fuentes

Aplicación web personal para conservar el historial y mantenimiento de una KTM 250 EXC TPI 2021. La fuente funcional principal es `especificaciones-proyecto-mantenimiento-ktm.pdf`. El proyecto debe poder mantenerse en código propio, alojarse en GitHub y publicarse en Cloudflare Pages sin depender de créditos de constructores de aplicaciones.

## Referencia para continuar el desarrollo

Revisado el 5 de septiembre de 2026: el documento funcional completo es `../especificaciones-proyecto-mantenimiento-ktm.pdf` (versión 1.0, 4 de septiembre de 2026, seis páginas). Este brief resume la primera fase; no sustituye los requisitos ni los criterios de aceptación del PDF. Las indicaciones posteriores del usuario complementan o modifican ese documento.

- Mantener separados por moto los eventos, componentes, documentos, gastos, configuración y avisos.
- Conservar los cambios de marcador como eventos inmutables con lectura anterior, lectura nueva y offsets históricos. Distinguir siempre uso real de lectura visible.
- Calcular el próximo mantenimiento desde el último mantenimiento válido, con intervalos configurables de 20 y 40 horas.
- Mostrar estados vacíos cuando no haya historial. No presentar datos de ejemplo como datos reales ni un índice de salud fijo; explicar los factores del índice cuando se implemente.
- Completar la ficha con bastidor y fechas de alta/compra; el libro de vida con filtros; y la gestión de componentes, ITV, gastos, documentos y banco técnico según el PDF.
- Mantener el control y la portabilidad de los datos, diseño responsive y arquitectura propia con GitHub y Cloudflare. Documentar las decisiones pendientes de persistencia, archivos, autenticación y avisos.
- Indicaciones posteriores del usuario: todas las vistas deben identificar la moto seleccionada con nombre, año, matrícula/ID y miniatura, incluido el modo taller. «Mis motos» debe mostrar todas las fichas separadas. Se ha añadido copia de seguridad y restauración manual de todas las motos.

Pendientes detectados al contrastar la versión actual: aún hay valores de ejemplo en algunas vistas; falta completar el historial inmutable de cambios de marcador. No considerar completos estos requisitos por tener ya su interfaz.

Actualización: cálculo por última revisión completada del mismo intervalo, conservando las horas reales de cada sesión. Preferencia del usuario: tolerar un retraso de hasta el 25 % del intervalo con aviso ámbar; por encima, rojo. Los avisos son informativos y no bloquean salidas. La siguiente revisión se calcula desde las horas reales en que se hizo la última, aunque se hubiera realizado tarde. Sin referencia válida se indica la ausencia de datos.

Actualización de flujo: Mantenimiento inicia una sesión nueva desde una tarjeta de selección múltiple. Las tareas de los intervalos elegidos se combinan eliminando duplicados. La interfaz excluye revisiones iniciales, 10 horas y planes deportivos o de competición.

## Objetivo de la primera fase

Construir una interfaz clara y responsive que permita consultar el estado de la moto, ver avisos de mantenimiento y registrar los eventos importantes de su vida útil.

## Entregables

- Frontend estático en HTML, CSS y JavaScript.
- Página Hoy, Dashboard, Libro de vida, Mantenimiento, Componentes, Documentos y gastos y Banco técnico.
- Datos de ejemplo basados en la KTM del proyecto.
- Formulario funcional para registrar eventos.
- Guardado local de tareas completadas.
- Diseño adaptable a móvil y escritorio.
- README con ejecución local, publicación y siguientes fases.

## Límites de autonomía

Se pueden crear y modificar archivos locales, preparar pruebas y dejar la aplicación lista para publicar. No se crean cuentas, repositorios externos, bases de datos, recursos de Cloudflare ni servicios de pago sin autorización expresa y sin los datos necesarios. No se incorporan documentos privados del directorio como archivos públicos de la aplicación.

## Definición de completado

La primera fase se considera completada cuando la navegación, el Dashboard, la página Hoy, las tareas y el registro de eventos funcionan en navegador; la interfaz se adapta razonablemente a móvil y escritorio; y el proyecto incluye instrucciones claras para continuar con persistencia, autenticación, documentos y despliegue.
