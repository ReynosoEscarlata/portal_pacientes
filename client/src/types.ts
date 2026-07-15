export type TipoCampo = 'text' | 'date' | 'select' | 'tel' | 'email' | 'textarea';

export interface CampoConfig {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  pattern?: string;
  maxLength?: number;
  catalogo?: string;
  ayuda?: string;
}

export type TipoFase = 'form' | 'aviso_privacidad' | 'confirmacion';

export interface FaseConfig {
  id: string;
  titulo: string;
  descripcion?: string;
  icono: string;
  tipo: TipoFase;
  sensible?: boolean;
  campos?: CampoConfig[];
}

export interface CatalogoItem {
  clave: string;
  descripcion: string;
}

export interface ConfigPortal {
  versionAviso: string;
  fases: FaseConfig[];
  catalogos: Record<string, CatalogoItem[]>;
}

export type ValoresFase = Record<string, string | boolean>;
export type DatosFases = Record<string, ValoresFase>;

export type EstadoFase = 'pendiente' | 'activa' | 'completada';
