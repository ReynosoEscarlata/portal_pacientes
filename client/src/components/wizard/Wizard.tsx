import { useWizard } from '../../context/WizardContext';
import type { EstadoFase } from '../../types';
import PhaseBadge from '../PhaseBadge';
import ProgressBar from '../ProgressBar';
import Avatar from '../Avatar';
import PhaseRenderer from './PhaseRenderer';
import AvisoPrivacidad from './phases/AvisoPrivacidad';
import Confirmacion from './phases/Confirmacion';

export default function Wizard() {
  const { config, datos, faseActual, maxFase, folio, irAFase, reiniciar } = useWizard();

  if (!config) return <div className="card">Cargando configuración…</div>;

  if (folio) {
    const nombre = String(datos.datos_personales?.nombre ?? '');
    const apellido = String(datos.datos_personales?.primerApellido ?? '');
    return (
      <div className="card folio-card">
        <Avatar nombre={nombre} apellido={apellido} grande />
        <h2>¡Pre-registro completado!</h2>
        <p>Presenta este folio en la recepción de la clínica:</p>
        <p className="folio-card__folio">{folio}</p>
        <p className="texto-secundario">
          Guárdalo: también lo necesitarás para consultar o eliminar tus datos en la sección
          “Mis datos (ARCO)”.
        </p>
        <button type="button" className="btn btn--primario" onClick={reiniciar}>
          Iniciar un nuevo pre-registro
        </button>
      </div>
    );
  }

  const fase = config.fases[faseActual];

  const estadoDe = (indice: number): EstadoFase => {
    if (indice === faseActual) return 'activa';
    if (datos[config.fases[indice].id]) return 'completada';
    return 'pendiente';
  };

  return (
    <div>
      <div className="card">
        <div className="chips">
          {config.fases.map((f, indice) => (
            <PhaseBadge
              key={f.id}
              fase={f}
              estado={estadoDe(indice)}
              navegable={indice <= maxFase}
              onIr={() => irAFase(indice)}
            />
          ))}
        </div>
        <ProgressBar indice={faseActual} total={config.fases.length} />
      </div>

      <div className="card">
        <h2 className="fase__titulo">
          <span aria-hidden="true">{fase.icono}</span> {fase.titulo}
        </h2>
        {fase.descripcion && <p className="texto-secundario">{fase.descripcion}</p>}

        {fase.tipo === 'form' && <PhaseRenderer fase={fase} />}
        {fase.tipo === 'aviso_privacidad' && <AvisoPrivacidad fase={fase} />}
        {fase.tipo === 'confirmacion' && <Confirmacion />}
      </div>
    </div>
  );
}
