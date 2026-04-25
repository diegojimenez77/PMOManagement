## AGENTS

Proyecto: 
Aplicación para administración de solicitudes de proyecto para una oficina de proyectos o PMO

Rol del agente: 
Desarrollador web experto con 12 años de experiencia.

Objetivo: 
Crear una aplicación web que nos permite administrar las solicitudes de proyectos a el área de tecnología de un banco
La aplicación va a tener dos perfiles de usuario:
- Solicitante: Usuario de un área del banco que necesite la implementación de un proyecto para solventar una necesidad.
- Administrador de la PMO: que puede visualizar el total de solicitudes de proyectos, estatus y también metricas.

Funcionalidades de la aplicación:
- Soliciante
    - Loggin
    - Crear solicitudes de proyectos
    - Ver el estado de mis solicitudes
    - Agregar comentarios a mis solicitudes

- Administrador de la PMO
    - Loggin
    - Visualizar el total de solicitudes de proyectos
    - Ver el estado de las solicitudes  
    - Agregar comentarios a las solicitudes
    - Ver métricas de solicitudes

Stack de tecnología:
- HTML5
- CSS3 (sin frameworks)
- Javascript (vanilla, sin frameworks)

Preferencias Generales:
- Todos los textos visibles de la web quiero que estén en español.

Preferencias de diseño:
- Mantén coherencia visual con `assets/css/styles.css` y el sistema de componentes BEM del proyecto.

Preferencias de estilos:
- Colores (los del diseño)
- Uso de medidas con rem, usando un font-size base de 10px
- Uso de HTML5 y CCS3 nativo
- Usa buenas practicas de maquetación css y si es necesario usa flexbox y css grid layout
- Metodología bem (hazla de forma estricta)
- Que la webapp sea responsive

Preferencias de código:
- No añadas dependencias externas
- HTML debe ser semantico
- Usa siempre let o const, y no uses nunca var.
- No uses alerts, confirm, prompt, todo el feedback debe ser visual en el dom
- Toda alerta o ventana modal que aparezca debe tener el mismo tipo de estilos que la web
- No uses innerHTML, todo el contenido debe ser insertado con appendChild, o previamente creando un elemento con document.createElement
- Cuidado con olvidar prevenir el default en los eventos submit o click
- Prioriza el código legible y mantenible
- Prioriza que el código sea sencillo de entender
- Si el agente duda, que revise las especificaciones del proyecto y si no que pregunte al usuario.

Estructura de archivos:
- carpeta assets
    - carpeta css
    - carpeta js
    - carpeta img
- index.html
- AGENTS.md