# Planificación 5G

Aplicación web (Vite + React + TypeScript) de dimensionado de redes 5G NR basada en 5G-RAND.

- Idioma: interfaz, comentarios y documentación en español.
- `src/engine/`: motor de cálculo puro (sin React). Toda fórmula nueva va aquí, con test en `src/engine/__tests__/`.
- `src/ui/`: interfaz. No poner cálculos de ingeniería en los componentes.
- Las fórmulas deben citar la especificación 3GPP de la que salen (TS 38.214, TS 38.101, TR 38.901).
- Antes de hacer commit: `npm test` y `npm run build`.
- `docs/REVISION_EXCEL.md` documenta los errores del Excel de partida; mantenerlo al día si cambia el criterio.
