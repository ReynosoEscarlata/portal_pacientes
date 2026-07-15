import { iniciales } from '../utils/mask';

interface Props {
  nombre: string;
  apellido: string;
  grande?: boolean;
}

export default function Avatar({ nombre, apellido, grande = false }: Props) {
  return (
    <div className={`avatar ${grande ? 'avatar--grande' : ''}`} aria-hidden="true">
      {iniciales(nombre, apellido)}
    </div>
  );
}
