import { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import type { FaseConfig } from '../../../types';

interface Props {
  fase: FaseConfig;
}

export default function AvisoPrivacidad({ fase }: Props) {
  const { config, datos, faseActual, guardarFase, irAFase } = useWizard();
  const yaAceptado = datos[fase.id]?.aceptado === true;
  const [aceptado, setAceptado] = useState(yaAceptado);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continuar = async () => {
    if (!aceptado || !config) return;
    setGuardando(true);
    setError(null);
    try {
      await guardarFase(fase.id, { aceptado: true, versionAviso: config.versionAviso });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el consentimiento');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fase">
      <div className="aviso" tabIndex={0}>
        <p className="aviso__version">
          Aviso de privacidad integral · Versión {config?.versionAviso}
        </p>

        <h3>Identidad y domicilio del responsable</h3>
        <p>
          <strong>Clínica ClinicConnect, S.A. de C.V.</strong> (entidad ficticia con fines de
          entrenamiento), con domicilio en Av. de la Salud 123, Col. Centro, C.P. 06000, Ciudad de
          México, es el responsable del tratamiento de tus datos personales conforme a la Ley
          Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
        </p>

        <h3>Datos personales que recabamos</h3>
        <p>
          Datos de identificación y contacto (nombre, fecha de nacimiento, sexo, CURP, teléfono,
          correo electrónico y domicilio) y <strong>datos personales sensibles</strong> relativos a
          tu estado de salud (motivo de consulta, alergias, medicamentos y antecedentes clínicos).
        </p>

        <h3>Finalidades del tratamiento</h3>
        <p>
          <strong>Primarias:</strong> pre-registrarte como paciente, agilizar tu recepción el día de
          tu cita y preparar tu atención médica. <strong>Secundarias:</strong> generación de
          estadísticas internas de manera disociada. No usamos tus datos con fines publicitarios ni
          los transferimos a terceros sin tu consentimiento, salvo las excepciones del artículo 37
          de la LFPDPPP.
        </p>

        <h3>Datos sensibles y consentimiento expreso</h3>
        <p>
          Por tratarse de datos sobre tu salud, requerimos tu <strong>consentimiento expreso</strong>.
          Estos datos se almacenan cifrados y solo el personal de salud autorizado puede
          consultarlos.
        </p>

        <h3>Derechos ARCO y medios para ejercerlos</h3>
        <p>
          Puedes ejercer tus derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO), así
          como revocar tu consentimiento: (1) en este portal, sección <strong>“Mis datos (ARCO)”</strong>,
          con tu folio y fecha de nacimiento; o (2) escribiendo a{' '}
          <strong>privacidad@clinicconnect.example</strong>. Responderemos en un plazo máximo de 20
          días hábiles.
        </p>

        <h3>Conservación y cambios al aviso</h3>
        <p>
          Los pre-registros se conservan únicamente el tiempo necesario para tu recepción. Cualquier
          cambio a este aviso se publicará en este portal indicando la nueva versión.
        </p>
      </div>

      <label className="consentimiento">
        <input
          type="checkbox"
          checked={aceptado}
          onChange={(e) => setAceptado(e.target.checked)}
        />
        <span>
          Otorgo mi <strong>consentimiento expreso</strong> para el tratamiento de mis datos
          personales, incluidos los datos sensibles de salud, conforme a este aviso de privacidad.
        </span>
      </label>

      {error && <p className="campo__error" role="alert">{error}</p>}

      <div className="fase__acciones">
        <button type="button" className="btn btn--secundario" onClick={() => irAFase(faseActual - 1)}>
          Atrás
        </button>
        <button
          type="button"
          className="btn btn--primario"
          disabled={!aceptado || guardando}
          onClick={() => void continuar()}
        >
          {guardando ? 'Guardando…' : 'Aceptar y continuar'}
        </button>
      </div>
    </div>
  );
}
