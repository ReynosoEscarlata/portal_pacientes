import { useEffect, useState } from 'react';
import type { CampoConfig, FaseConfig } from '../../types';
import { useWizard } from '../../context/WizardContext';
import { ApiError } from '../../api/client';
import Field from '../fields/Field';

interface Props {
  fase: FaseConfig;
}

function validarCampo(campo: CampoConfig, valor: string): string | null {
  const v = (valor ?? '').trim();
  if (campo.requerido && v === '') return `${campo.etiqueta} es obligatorio`;
  if (v !== '' && campo.pattern && !new RegExp(campo.pattern).test(v)) {
    return `${campo.etiqueta} no tiene un formato válido`;
  }
  if (campo.maxLength && v.length > campo.maxLength) {
    return `${campo.etiqueta} no debe exceder ${campo.maxLength} caracteres`;
  }
  return null;
}

export default function PhaseRenderer({ fase }: Props) {
  const { config, datos, faseActual, guardarFase, irAFase } = useWizard();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    setValores((datos[fase.id] as Record<string, string>) ?? {});
    setErrores({});
    setErrorEnvio(null);
  }, [fase.id, datos]);

  const campos = fase.campos ?? [];

  const cambiar = (nombre: string, valor: string) => {
    setValores((previos) => ({ ...previos, [nombre]: valor }));
    setErrores((previos) => {
      const { [nombre]: _omitido, ...resto } = previos;
      return resto;
    });
  };

  const continuar = async () => {
    // Validación en frontend antes de pedir la validación del backend.
    const nuevosErrores: Record<string, string> = {};
    for (const campo of campos) {
      const error = validarCampo(campo, valores[campo.nombre] ?? '');
      if (error) nuevosErrores[campo.nombre] = error;
    }
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const completos: Record<string, string> = {};
    for (const campo of campos) {
      completos[campo.nombre] = (valores[campo.nombre] ?? '').trim();
    }

    setGuardando(true);
    setErrorEnvio(null);
    try {
      await guardarFase(fase.id, completos);
    } catch (err) {
      if (err instanceof ApiError && err.detalles.length > 0) {
        const delServidor: Record<string, string> = {};
        for (const detalle of err.detalles) {
          delServidor[detalle.campo] = detalle.mensaje;
        }
        setErrores(delServidor);
      } else {
        setErrorEnvio(err instanceof Error ? err.message : 'No se pudo guardar la fase');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form
      className="fase"
      onSubmit={(e) => {
        e.preventDefault();
        void continuar();
      }}
      noValidate
    >
      {fase.sensible && (
        <p className="aviso-sensible">
          🔒 Los datos de esta fase son <strong>sensibles</strong>: se guardan cifrados y solo el
          personal de salud podrá consultarlos.
        </p>
      )}

      {campos.map((campo) => (
        <Field
          key={campo.nombre}
          campo={campo}
          valor={valores[campo.nombre] ?? ''}
          error={errores[campo.nombre]}
          catalogo={campo.catalogo ? config?.catalogos[campo.catalogo] : undefined}
          sensible={fase.sensible}
          onCambio={(v) => cambiar(campo.nombre, v)}
        />
      ))}

      {errorEnvio && <p className="campo__error" role="alert">{errorEnvio}</p>}

      <div className="fase__acciones">
        {faseActual > 0 && (
          <button type="button" className="btn btn--secundario" onClick={() => irAFase(faseActual - 1)}>
            Atrás
          </button>
        )}
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar y continuar'}
        </button>
      </div>
    </form>
  );
}
