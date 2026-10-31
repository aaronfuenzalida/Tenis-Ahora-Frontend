# Instrucciones generales

## Interfaz y estilo visual

- Sin emojis. Ni en la UI, ni en el código, ni en los commits, ni en las
  respuestas del chat.
- Sin badges: nada de shields.io, estado de build, cobertura o versión, ni en el
  README ni en la interfaz.
- Sin pulse-dots, glow, halos ni indicadores de actividad decorativos. Un
  spinner solo si hay una espera real que el usuario percibe.
- Iconos con moderación: valen para acciones en una barra donde no entra el
  texto. No poner un icono por cada ítem de una lista ni al lado de cada título.
- Nada de animaciones de entrada ni transiciones salvo que las pida.
- Jerarquía con espaciado y tipografía antes que con bordes, sombras y cajas.
  Si un elemento no comunica nada que el texto ya no diga, va afuera.
- Respetar el sistema de diseño que ya exista en el proyecto (tokens, variables,
  componentes) en vez de inventar estilos nuevos.

## Código

- Las convenciones del archivo que estoy editando ganan sobre cualquier
  preferencia general. Antes de escribir algo nuevo, mirar un archivo parecido
  y seguir ese patrón.
- Hacer el cambio mínimo que resuelve el problema. No refactorizar de paso.
- Editar lo que ya existe antes que crear archivos nuevos.
- No agregar abstracciones, capas de configuración ni manejo de errores que no
  pedí.
- No introducir una dependencia nueva para algo que la librería estándar
  resuelve.
- Comentar el porqué, no el qué. Nada de comentarios que repiten la línea
  siguiente.
- No dejar código muerto, flags de compatibilidad ni funciones "por las dudas"
  en código que recién se escribe.
- No borrar ni reescribir código que no tiene que ver con la tarea.

## Respuestas

- Español, directo y breve. Sin preámbulos ni resúmenes de lo que acabás de
  hacer salvo que haga falta.
- Nada de "¡Perfecto!", "Excelente pregunta" ni elogios.
- Si hay una forma mejor de hacer lo que pedí, decirlo en una línea y seguir.
- Marcar la incertidumbre cuando la hay, en vez de responder con seguridad de
  más.
