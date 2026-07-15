interface Props {
  indice: number;
  total: number;
}

export default function ProgressBar({ indice, total }: Props) {
  const porcentaje = total > 0 ? Math.round((indice / total) * 100) : 0;

  return (
    <div className="progreso">
      <div
        className="progreso__pista"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance del pre-registro"
      >
        <div className="progreso__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="progreso__texto">
        Fase {indice + 1} de {total} · {porcentaje}%
      </span>
    </div>
  );
}
