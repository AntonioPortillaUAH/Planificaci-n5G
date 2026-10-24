# Planificación 5G

Aplicación web para el **dimensionado de redes de acceso radio 5G NR**: estima el número de emplazamientos necesarios
por cobertura y por capacidad en cuatro tipos de zona (urbano denso, urbano, suburbano y rural) con una previsión a cinco años.

Sigue el método de la herramienta **5G-RAND** de Y. Y. Wong y T. C. Chuah (*An online learning tool for 5G radio access
network dimensioning*, Journal of Engineering Science and Technology, 18(3), 2023), utilizada con permiso del autor,
y corrige los errores detectados en la réplica en Excel de un TFG (ver [`docs/REVISION_EXCEL.md`](docs/REVISION_EXCEL.md)).

## Funcionalidad

- **Capa física y throughput**: PRB (TS 38.101-1/-2), numerología, DMRS y sobrecarga, TBS según TS 38.214 §5.1.3.2,
  SNR requerido (Shannon atenuado), sensibilidad y throughput por MCS para UL y DL (FDD/TDD, MIMO).
- **Balance de enlace**: MAPL UL/DL, radio de celda con los modelos UMi, UMa y RMa de TR 38.901 (inversión numérica),
  selección de 6 MCS UL, emparejamiento con la MCS DL de radio más próximo y throughput medio por emplazamiento.
- **Emplazamientos**: mercado y clases de abonado, demanda en hora cargada, requisitos de cobertura y crecimientos anuales,
  recuento por cobertura, por capacidad y final, con tablas y gráficas.
- Escenario por defecto con los datos de las Tablas 2 y 3 del artículo; guardado automático en el navegador y
  exportación/importación en JSON.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # tests del motor de cálculo
npm run build      # compilación de producción en dist/
```

El motor de cálculo (`src/engine`) es TypeScript puro, sin dependencias de la interfaz, y está cubierto por tests
(`src/engine/__tests__`). La interfaz (`src/ui`) usa React y Recharts.

## Publicación

El flujo `.github/workflows/deploy.yml` ejecuta los tests, compila y publica la aplicación en GitHub Pages en cada
push a `main`. Hay que activar Pages una vez en *Settings → Pages → Source: GitHub Actions*.
