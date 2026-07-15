import { useState } from 'react';
import { api, ApiError } from '../api/client';

interface CampoDato {
  etiqueta: string;
  valor: string;
}

function filas(objeto: Record<string, unknown>, etiquetas: Record<string, string>): CampoDato[] {
  return Object.entries(etiquetas)
    .filter(([clave]) => objeto?.[clave] !== undefined && objeto?.[clave] !== '')
    .map(([clave, etiqueta]) => ({ etiqueta, valor: String(objeto[clave]) }));
}

export default function ConsultaArco() {
  const [folio, setFolio] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminado, setEliminado] = useState(false);

  const consultar = async () => {
    setCargando(true);
    setError(null);
    setEliminado(false);
    setConfirmando(false);
    try {
      setResultado(await api.arcoConsulta(folio.trim(), fechaNacimiento));
    } catch (err) {
      setResultado(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo realizar la consulta');
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async () => {
    setCargando(true);
    setError(null);
    try {
      await api.arcoEliminar(folio.trim(), fechaNacimiento);
      setResultado(null);
      setConfirmando(false);
      setEliminado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el pre-registro');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>🛡️ Mis datos (derechos ARCO)</h2>
        <p className="texto-secundario">
          Consulta o elimina tu pre-registro con el folio que recibiste y tu fecha de nacimiento.
          La CURP, el teléfono y el correo se muestran enmascarados por seguridad.
        </p>

        <form
          className="fase"
          onSubmit={(e) => {
            e.preventDefault();
            void consultar();
          }}
        >
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="arco-folio">Folio de pre-registro</label>
            <input
              id="arco-folio"
              className="campo__control"
              type="text"
              placeholder="CC-2026-ABC123"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              required
            />
          </div>
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="arco-fecha">Fecha de nacimiento</label>
            <input
              id="arco-fecha"
              className="campo__control"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
            />
          </div>
          <div className="fase__acciones">
            <button type="submit" className="btn btn--primario" disabled={cargando}>
              {cargando ? 'Consultando…' : 'Consultar mis datos'}
            </button>
          </div>
        </form>

        {error && <p className="campo__error" role="alert">{error}</p>}
        {eliminado && (
          <p className="mensaje-exito" role="status">
            ✅ Tu pre-registro y todos tus datos fueron eliminados.
          </p>
        )}
      </div>

      {resultado && (
        <div className="card">
          <h2>Pre-registro {resultado.folio}</h2>

          <section className="resumen__seccion">
            <h3>👤 Datos personales</h3>
            <dl className="resumen__lista">
              {filas(resultado.datosPersonales, {
                nombre: 'Nombre(s)',
                primerApellido: 'Primer apellido',
                segundoApellido: 'Segundo apellido',
                fechaNacimiento: 'Fecha de nacimiento',
                curp: 'CURP',
                telefono: 'Teléfono',
                correo: 'Correo'
              }).map((fila) => (
                <div key={fila.etiqueta} className="resumen__fila">
                  <dt>{fila.etiqueta}</dt>
                  <dd>{fila.valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="resumen__seccion">
            <h3>🏠 Domicilio</h3>
            <dl className="resumen__lista">
              {filas(resultado.domicilio, {
                calle: 'Calle',
                numero: 'Número',
                colonia: 'Colonia',
                cp: 'Código postal',
                municipio: 'Municipio',
                estado: 'Entidad (clave)'
              }).map((fila) => (
                <div key={fila.etiqueta} className="resumen__fila">
                  <dt>{fila.etiqueta}</dt>
                  <dd>{fila.valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="resumen__seccion">
            <h3>🩺 Datos clínicos <span className="etiqueta-sensible">🔒 sensibles</span></h3>
            <dl className="resumen__lista">
              {filas(resultado.datosClinicos, {
                motivoConsulta: 'Motivo de consulta',
                alergias: 'Alergias',
                medicamentosActuales: 'Medicamentos actuales',
                antecedentes: 'Antecedentes'
              }).map((fila) => (
                <div key={fila.etiqueta} className="resumen__fila">
                  <dt>{fila.etiqueta}</dt>
                  <dd>{fila.valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="texto-secundario">
            Consentimiento otorgado el {new Date(resultado.consentimiento.timestamp).toLocaleString('es-MX')}{' '}
            (aviso versión {resultado.consentimiento.versionAviso}).
          </p>

          {!confirmando ? (
            <div className="fase__acciones">
              <button type="button" className="btn btn--peligro" onClick={() => setConfirmando(true)}>
                Eliminar mis datos
              </button>
            </div>
          ) : (
            <div className="confirmar-eliminar" role="alertdialog" aria-label="Confirmar eliminación">
              <p>
                <strong>¿Eliminar definitivamente tu pre-registro?</strong> Esta acción no se puede
                deshacer y tendrás que capturar todo de nuevo si deseas pre-registrarte.
              </p>
              <div className="fase__acciones">
                <button type="button" className="btn btn--secundario" onClick={() => setConfirmando(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn--peligro" disabled={cargando} onClick={() => void eliminar()}>
                  {cargando ? 'Eliminando…' : 'Sí, eliminar todo'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
