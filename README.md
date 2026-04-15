# 🏆 Gestor de Torneo Deportivo

Sitio web interactivo para organizar un torneo deportivo completo: desde la fase de grupos hasta la final, con generación automática de partidos.

## Cómo usar

1. **Abrir el sitio:** Abre `index.html` en cualquier navegador moderno. No necesita servidor.
2. **Registrar equipos:** Escribe el nombre del equipo y haz clic en "Agregar Equipo" (mínimo 4 equipos).
3. **Generar torneo:** Haz clic en "Generar Torneo". Los equipos se distribuyen aleatoriamente en grupos.
4. **Ingresar resultados de grupo:** Ve a la sección "Partidos" e ingresa los marcadores de cada partido.
5. **Ver tabla de posiciones:** La sección "Tabla" muestra la clasificación actualizada automáticamente.
6. **Fase eliminatoria:** Al completar todos los partidos de grupo, se generan las llaves eliminatorias automáticamente.
7. **Jugar eliminatorias:** Ingresa los resultados de cada llave. Los empates no están permitidos en eliminatorias.
8. **¡Campeón!** Al decidirse la final, se muestra el campeón del torneo.

## Características

- **Registro de equipos** con validación de duplicados.
- **Generación automática** de grupos y partidos round-robin.
- **Tablas de posiciones** con puntos, diferencia de goles y posiciones calculadas en tiempo real.
- **Fase eliminatoria** con bracket visual (cuartos, semis, final).
- **Persistencia** automática en `localStorage` — el progreso se guarda al cerrar el navegador.
- **Reiniciar torneo** en cualquier momento.
- **Validaciones**: no se permiten resultados negativos ni equipos duplicados.
- **Diseño responsive** que funciona en escritorio y móvil.

## Tecnología

- HTML5, CSS3 y JavaScript vanilla.
- Sin dependencias externas ni servidor backend.
- Todo funciona directamente en el navegador.

## Archivos

| Archivo      | Descripción                        |
|--------------|------------------------------------|
| `index.html` | Estructura y secciones del sitio   |
| `styles.css` | Estilos y diseño responsive        |
| `app.js`     | Toda la lógica del torneo          |