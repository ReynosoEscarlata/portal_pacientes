import type { Pagina } from '../App';

interface Props {
  onNavegar: (pagina: Pagina) => void;
}

export default function Inicio({ onNavegar }: Props) {
  const hayBorrador = Boolean(localStorage.getItem('cc_draft_id'));

  return (
    <div>
      <div className="card inicio-hero">
        <h1>Agiliza tu llegada a la clínica</h1>
        <p className="texto-secundario">
          Completa tu pre-registro desde casa: al llegar, solo presenta tu folio en recepción y
          pasa directo a tu atención.
        </p>
        <div className="inicio-hero__acciones">
          <button type="button" className="btn btn--primario btn--grande" onClick={() => onNavegar('registro')}>
            {hayBorrador ? 'Continuar mi borrador' : 'Comenzar pre-registro'}
          </button>
          <button type="button" className="btn btn--secundario" onClick={() => onNavegar('arco')}>
            Consultar o eliminar mis datos (ARCO)
          </button>
        </div>
      </div>

      <div className="card">
        <h2>¿Cómo funciona?</h2>
        <ol className="pasos">
          <li>
            <strong>Captura tus datos</strong> en un asistente por fases: puedes guardar y retomar
            tu borrador cuando quieras.
          </li>
          <li>
            <strong>Acepta el aviso de privacidad</strong>: tus datos de salud se guardan cifrados
            y solo el personal autorizado los consulta.
          </li>
          <li>
            <strong>Recibe tu folio</strong> y preséntalo en recepción el día de tu cita.
          </li>
        </ol>
      </div>

      <div className="card">
        <h2>Tu privacidad, primero</h2>
        <p className="texto-secundario">
          Este portal cumple con la LFPDPPP y la NOM-024-SSA3-2012: solo pedimos los datos
          necesarios, los datos sensibles se cifran en reposo, y puedes ejercer tus derechos ARCO
          (acceso, rectificación, cancelación y oposición) con tu folio y fecha de nacimiento.
        </p>
      </div>
    </div>
  );
}
