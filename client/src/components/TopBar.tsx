import type { Pagina } from '../App';

interface Props {
  pagina: Pagina;
  onNavegar: (pagina: Pagina) => void;
}

const enlaces: { id: Pagina; etiqueta: string; icono: string }[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: '🏥' },
  { id: 'registro', etiqueta: 'Pre-registro', icono: '📝' },
  { id: 'arco', etiqueta: 'Mis datos (ARCO)', icono: '🛡️' }
];

export default function TopBar({ pagina, onNavegar }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__contenido">
        <button className="topbar__marca" onClick={() => onNavegar('inicio')}>
          ClinicConnect
        </button>
        <input
          className="topbar__buscador"
          type="search"
          placeholder="Buscar en ClinicConnect"
          aria-hidden="true"
          tabIndex={-1}
          readOnly
        />
        <nav className="topbar__nav" aria-label="Navegación principal">
          {enlaces.map((enlace) => (
            <button
              key={enlace.id}
              className={`topbar__enlace ${pagina === enlace.id ? 'topbar__enlace--activo' : ''}`}
              onClick={() => onNavegar(enlace.id)}
            >
              <span aria-hidden="true">{enlace.icono}</span>
              <span className="topbar__enlace-texto">{enlace.etiqueta}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
