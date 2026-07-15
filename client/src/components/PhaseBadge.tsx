import type { EstadoFase, FaseConfig } from '../types';

interface Props {
  fase: FaseConfig;
  estado: EstadoFase;
  navegable: boolean;
  onIr: () => void;
}

const etiquetaEstado: Record<EstadoFase, string> = {
  pendiente: 'Pendiente',
  activa: 'En curso',
  completada: 'Completada'
};

export default function PhaseBadge({ fase, estado, navegable, onIr }: Props) {
  return (
    <button
      type="button"
      className={`chip chip--${estado}`}
      disabled={!navegable}
      onClick={onIr}
      title={`${fase.titulo}: ${etiquetaEstado[estado]}`}
    >
      <span aria-hidden="true">{fase.icono}</span>
      <span>{fase.titulo}</span>
      {estado === 'completada' && <span aria-hidden="true">✓</span>}
    </button>
  );
}
