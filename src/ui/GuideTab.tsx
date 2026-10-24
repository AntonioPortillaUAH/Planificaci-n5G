import { Panel } from './fields';

export function GuideTab() {
  return (
    <>
      <Panel title="Qué hace esta herramienta">
        <p>
          Estima el número de emplazamientos (gNB) necesarios para desplegar una red de acceso radio 5G NR en una región
          con cuatro tipos de zona de servicio (urbano denso, urbano, suburbano y rural), tanto por <strong>cobertura</strong> como
          por <strong>capacidad</strong>, con una previsión a cinco años. Sigue el método de la herramienta 5G-RAND
          (Wong y Chuah, 2023) y las especificaciones 3GPP TS 38.214, TS 38.101 y TR 38.901.
        </p>
        <ol className="steps">
          <li>
            <strong>Capa física y throughput.</strong> Para cada zona se define la portadora (frecuencia, duplexado, ancho de banda,
            numerología y capas MIMO). Para cada MCS se calcula el SNR requerido, la sensibilidad del receptor, el tamaño de bloque
            de transporte (TBS) según TS 38.214 §5.1.3.2 y el throughput de una celda.
          </li>
          <li>
            <strong>Balance de enlace.</strong> Con las especificaciones de equipos y las pérdidas de la zona se obtiene el MAPL de cada MCS
            y, con el modelo de propagación de TR 38.901, el radio de celda. Se eligen seis MCS en el enlace ascendente (el más
            restrictivo): el radio de la MCS más robusta fija la cobertura. Para cada radio UL se toma la MCS DL de radio más próximo,
            y el emplazamiento se divide en anillos para obtener el throughput DL medio por emplazamiento.
          </li>
          <li>
            <strong>Emplazamientos.</strong> A partir del mercado (población, cuota, clases de abonado) se calcula la demanda DL en hora
            cargada. Los emplazamientos por cobertura son la superficie a cubrir entre la superficie de un emplazamiento
            (1,95·R² trisectorial, 2,6·R² omnidireccional); los de capacidad, la demanda entre el throughput medio. El resultado es el máximo de ambos.
          </li>
        </ol>
      </Panel>
      <Panel title="Uso">
        <ul>
          <li>Todos los resultados se recalculan al instante al cambiar cualquier parámetro.</li>
          <li>El escenario se guarda automáticamente en este navegador. Con los botones de la cabecera puede exportarlo a un fichero JSON, importarlo o volver al escenario del artículo.</li>
          <li>Pase el ratón sobre un campo para ver una explicación cuando la tiene.</li>
          <li>Los radios que quedan fuera del rango de validez del modelo de propagación se marcan con ⚠.</li>
        </ul>
      </Panel>
      <Panel title="Supuestos del modelo">
        <ul>
          <li>SNR requerido por MCS mediante Shannon atenuado: eficiencia = α·log2(1 + SNR), más un margen de interferencia por modulación.</li>
          <li>Sensibilidad = −174 dBm/Hz + 10·log10(ancho de banda ocupado) + figura de ruido + SINR requerido.</li>
          <li>Abonados distribuidos uniformemente en la celda; red homogénea (un único tipo de emplazamiento por zona).</li>
          <li>Demanda por abonado = consumo mensual · 8000 / (días · horas de uso · 3600) · factor de actividad.</li>
        </ul>
      </Panel>
      <Panel title="Referencias">
        <ul className="refs">
          <li>Y. Y. Wong y T. C. Chuah, «An online learning tool for 5G radio access network dimensioning», <em>Journal of Engineering Science and Technology</em>, 18(3), 1670–1684, 2023. Herramienta original: 5g-rand.wixsite.com/5grand (uso con permiso del autor).</li>
          <li>3GPP TS 38.214: <em>NR; Physical layer procedures for data</em>.</li>
          <li>3GPP TS 38.101-1 y 38.101-2: <em>NR; User Equipment radio transmission and reception</em>.</li>
          <li>3GPP TR 38.901: <em>Study on channel model for frequencies from 0.5 to 100 GHz</em>.</li>
        </ul>
      </Panel>
    </>
  );
}
