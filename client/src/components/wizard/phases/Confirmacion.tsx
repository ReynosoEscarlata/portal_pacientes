import { useState } from 'react';
import { useWizard } from '../../../context/WizardContext';
import { enmascararCurp, enmascararTelefono, enmascararCorreo } from '../../../utils/mask';
import type { CampoConfig, FaseConfig } from '../../../types';

const MASCARAS: Record<string, (v: string) => string> = {
  curp: enmascararCurp,
  telefono: enmascararTelefono,
  correo: enmascararCorreo
};

export default function Confirmacion() {
  const { config, datos, enviar, irAFase } = useWizard();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!config) return null;

  const fasesFormulario = config.fases.filter((f) => f.tipo === 'form');

  const valorMostrado = (fase: FaseConfig, campo: CampoConfig): string => {
    const bruto = String(datos[fase.id]?.[campo.nombre] ?? '');
    if (bruto === '') return '—';
    const mascara = MASCARAS[campo.nombre];
    if (mascara) return mascara(bruto);
    if (campo.catalogo) {
      const item = config.catalogos[campo.catalogo]?.find((c) => c.clave === bruto);
      return item ? item.descripcion : bruto;
    }
    return bruto;
  };

  const confirmarEnvio = async () => {
    setEnviando(true);
    setError(null);
    try {
      await enviar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el registro');
      setEnviando(false);
    }
  };

  return (
    <div className="fase">
      <p className="resumen__intro">
        Revisa tu información antes de generar el folio. Algunos datos se muestran enmascarados
        para proteger tu privacidad.
      </p>

      {fasesFormulario.map((fase) => (
        <section key={fase.id} className="resumen__seccion">
          <header className="resumen__encabezado">
            <h3>
              <span aria-hidden="true">{fase.icono}</span> {fase.titulo}
            </h3>
            <button
              type="button"
              className="btn btn--liga"
              onClick={() => irAFase(config.fases.findIndex((f) => f.id === fase.id))}
            >
              Editar
            </button>
          </header>
          <dl className="resumen__lista">
            {(fase.campos ?? []).map((campo) => (
              <div key={campo.nombre} className="resumen__fila">
                <dt>{campo.etiqueta}</dt>
                <dd>{valorMostrado(fase, campo)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <p className="resumen__consentimiento">
        {datos.consentimiento?.aceptado === true
          ? '✅ Consentimiento del aviso de privacidad otorgado.'
          : '⚠️ Aún no has aceptado el aviso de privacidad.'}
      </p>

      {error && <p className="campo__error" role="alert">{error}</p>}

      <div className="fase__acciones">
        <button
          type="button"
          className="btn btn--secundario"
          onClick={() => irAFase(config.fases.length - 2)}
        >
          Atrás
        </button>
        <button
          type="button"
          className="btn btn--exito"
          disabled={enviando || datos.consentimiento?.aceptado !== true}
          onClick={() => void confirmarEnvio()}
        >
          {enviando ? 'Enviando…' : 'Enviar registro'}
        </button>
      </div>
    </div>
  );
}
