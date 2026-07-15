import type { CampoConfig, CatalogoItem } from '../../types';

interface Props {
  campo: CampoConfig;
  valor: string;
  error?: string;
  catalogo?: CatalogoItem[];
  sensible?: boolean;
  onCambio: (valor: string) => void;
}

export default function Field({ campo, valor, error, catalogo, sensible, onCambio }: Props) {
  const idCampo = `campo-${campo.nombre}`;
  const claseControl = `campo__control ${error ? 'campo__control--error' : ''}`;

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={idCampo}>
        {campo.etiqueta}
        {campo.requerido && <span className="campo__requerido" aria-hidden="true"> *</span>}
        {sensible && <span className="etiqueta-sensible">🔒 dato sensible</span>}
      </label>

      {campo.tipo === 'textarea' ? (
        <textarea
          id={idCampo}
          className={claseControl}
          value={valor}
          maxLength={campo.maxLength}
          rows={3}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={!!error}
        />
      ) : campo.tipo === 'select' ? (
        <select
          id={idCampo}
          className={claseControl}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={!!error}
        >
          <option value="">Selecciona una opción…</option>
          {(catalogo ?? []).map((item) => (
            <option key={item.clave} value={item.clave}>
              {item.descripcion}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={idCampo}
          className={claseControl}
          type={campo.tipo}
          value={valor}
          maxLength={campo.maxLength}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={!!error}
        />
      )}

      {campo.ayuda && !error && <p className="campo__ayuda">{campo.ayuda}</p>}
      {error && <p className="campo__error" role="alert">{error}</p>}
    </div>
  );
}
