# Revisión del Excel `PROYECTO_TFG_CASO_REAL.xlsx`

Revisión de las tres primeras hojas del libro del estudiante (*Physical Layer & Throughput*,
*Advanced Link Budget* y *Capacity & Coverage Site Counts*). La hoja `DISTRIB_ZONAS_1` no se
ha considerado. Para cada problema se indica la celda de ejemplo y cómo se resuelve en la aplicación.

## 1. Capa física y throughput

| # | Problema | Ejemplo | En la aplicación |
|---|----------|---------|------------------|
| 1.1 | Throughput dividido por 1024·1024 en lugar de 10⁶ (subestima un 4,6 %). | `Z6 = X6*C21/(1024*1024)` | Mbps = TBS · slots/s · fracción de tiempo / 10⁶. |
| 1.2 | TBS para N_info ≤ 3824: no cuantifica N_info (n = max(3, ⌊log2 N_info⌋ − 6)) y elige el valor de la tabla más **cercano** en vez del menor que **no sea inferior**. Las columnas T/U dan `#VALUE!` cuando N_info > 3824. | `V6`, `T6` | Implementación literal de TS 38.214 §5.1.3.2. |
| 1.3 | TBS para N_info > 3824: falta `max(3840, …)` en N'_info y la condición de 8424 se evalúa sobre N_info en lugar de N'_info. | `X6` | Corregido. |
| 1.4 | Con más de 4 capas no se usan dos codewords. | `P6` | TBS = TBS(⌊v/2⌋) + TBS(⌈v/2⌉) si v > 4. |
| 1.5 | La sensibilidad usa el ancho de banda del canal (p. ej. 100 MHz) y no el ocupado (N_PRB·12·SCS). | `N6 = -174+10*LOG10(C7*1e6)+…` | Se usa el ancho de banda ocupado. |
| 1.6 | En la tabla qam64 el SNR requerido está copiado fila a fila de la tabla qam256, de modo que MCS con eficiencias distintas tienen el mismo SNR (p. ej. MCS 10 de la tabla 1, 16QAM 1,33, con 6 dB, igual que 16QAM 2,57). | `AG16` | SNR requerido calculado a partir de la eficiencia (Shannon atenuado, α configurable). |
| 1.7 | La columna "FDD" usa FR1 y la "TDD" usa FR2: el duplexado queda ligado al rango de frecuencias. | `C6:D6` | Cada zona define su frecuencia (FR deducido), duplexado, BW y SCS. |
| 1.8 | Tabla de PRB en un `IF` anidado de 45 niveles, con `NA` sin paréntesis y combinaciones FR1 incompletas (faltan 35, 45, 70 MHz). | `C9` | Tablas completas de TS 38.101-1/-2. |
| 1.9 | Número de símbolos DMRS para mapeo tipo B ignora las posiciones adicionales. | `C16` | N_DMRS = RE por grupo CDM · grupos CDM sin datos · longitud · (1 + posiciones adicionales). |
| 1.10 | Fórmula con referencia rota a otro libro. | `G129 = '[1]Physical Layer & Throughput'!#REF!` | — |

## 2. Balance de enlace

| # | Problema | Ejemplo | En la aplicación |
|---|----------|---------|------------------|
| 2.1 | Las zonas Urbano, Suburbano y Rural usan el duplexado (`$E$18`) y las pérdidas/ganancias (`$D$19:$D$24`) de **Urbano denso**, no las suyas. | `G39`, `G59`, `G79`, `G49` | Cada zona usa sus propios parámetros. |
| 2.2 | Signo de las pérdidas de cable del gNB inconsistente: `+$D$10` en urbano denso/urbano y `-$D$10` en suburbano/rural (con D10 = −0,4). | `G19` vs `G59` | Pérdidas siempre positivas y restadas. |
| 2.3 | En el DL la altura del UE en el modelo de propagación es la del **mástil del gNB** (`$D$9`, `$D$8`, `$D$7`). | `H29` | Se usa la altura del UE. |
| 2.4 | El radio UL urbano/suburbano se calcula con UMi, pero la tabla de radios DL con la que se empareja usa UMa: UL y DL con modelos distintos. | `H39` vs `K104` | Un único modelo por zona para UL y DL. |
| 2.5 | La tabla de radios DL urbanos usa la frecuencia de la zona suburbana (`$D$58`). | `K104` | Corregido. |
| 2.6 | La MCS DL de la zona rural se busca en la tabla de la zona suburbana (`$E$58`, columnas P/R). | `F89` | Corregido. |
| 2.7 | La sensibilidad TDD de la tabla DL apunta a la tabla UL (`AK40`). | `E104` | Corregido. |
| 2.8 | El throughput de las MCS **DL** se toma de la tabla **UL** (PUSCH, capas UL, fracción UL). | `M29` | El throughput DL sale de la portadora DL. |
| 2.9 | El throughput medio por emplazamiento suma sólo 4 de las 6 MCS en urbano, suburbano y rural. | `P49 = M49*L49+…+M52*L52` | Se suman las 6. |
| 2.10 | Superficie del emplazamiento π·R² (círculo), en lugar de la celda hexagonal (1,95·R² trisectorial, 2,6·R² omni) que usa el artículo (Fig. 3: R = 0,2057 km → 0,0825 km²). | `I19` | K·R² según el tipo de antena. |
| 2.11 | El duplexado se deduce de una lista cerrada de frecuencias (3,5/3,7/4,7/28/39 GHz → TDD). | `E18` | Seleccionable. |
| 2.12 | Modelos de propagación sólo con la ecuación NLOS' y sin comprobar el rango de validez. | `H19` | NLOS completo (máx. LOS/NLOS') opcional y aviso fuera de rango. |
| 2.13 | Potencia del UE de 27,8 dBm (`10·log10(600)`), superior a la clase de potencia 3 (23 dBm). | `H12` | 23 dBm por defecto (editable). |

## 3. Recuento de emplazamientos

| # | Problema | Ejemplo | En la aplicación |
|---|----------|---------|------------------|
| 3.1 | La demanda mezcla unidades: consumo **mensual** en GB tratado como horario y convertido con ·1000/3600 (MB/s, falta ·8 para Mbps). | `D75 = D73*D74*1000/3600` | Demanda = GB/mes · 8000 / (días · horas de uso · 3600) · factor de actividad. |
| 3.2 | El reparto de clases de abonado de urbano denso (`$C$44:$C$47`) se aplica a todas las zonas. | `F84` | Reparto común explícito. |
| 3.3 | Clases intercambiadas en la demanda urbana (C47 con L18 y C46 con M18). | `I84` | — |
| 3.4 | No hay previsión a 5 años (sólo año 1) ni crecimiento de tráfico/abonados. | — | Previsión a 5 años con crecimientos por zona (Tabla 3 del artículo). |
| 3.5 | El throughput medio UL se calcula pero no se usa. | `D71` | Se muestra en el balance de enlace. |

## Observación sobre el artículo

Las cifras de la Tabla 2 del artículo implican unos 5 Mbps de demanda por abonado en hora cargada
(p. ej. urbano: 841 505 Mbps / 175 500 abonados), un valor que coincide con aplicar ·1000/3600 al consumo
mensual (20,05 GB → 5,57), es decir, la misma conversión dimensionalmente dudosa del Excel (3.1). La aplicación
usa una conversión coherente y deja los parámetros a la vista para que cada escenario pueda ajustarse.
