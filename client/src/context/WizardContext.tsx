import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api/client';
import type { ConfigPortal, DatosFases, ValoresFase } from '../types';

const CLAVE_DRAFT = 'cc_draft_id';

interface WizardContextValor {
  config: ConfigPortal | null;
  datos: DatosFases;
  faseActual: number;
  maxFase: number;
  draftId: string | null;
  folio: string | null;
  cargando: boolean;
  errorGeneral: string | null;
  iniciar: () => Promise<void>;
  guardarFase: (faseId: string, valores: ValoresFase) => Promise<void>;
  irAFase: (indice: number) => void;
  enviar: () => Promise<void>;
  reiniciar: () => void;
}

const WizardContext = createContext<WizardContextValor | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigPortal | null>(null);
  const [datos, setDatos] = useState<DatosFases>({});
  const [faseActual, setFaseActual] = useState(0);
  const [maxFase, setMaxFase] = useState(0);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  useEffect(() => {
    api
      .obtenerConfig()
      .then(setConfig)
      .catch(() => setErrorGeneral('No se pudo cargar la configuración del portal'));
  }, []);

  const iniciar = useCallback(async () => {
    if (draftId || cargando) return;
    setCargando(true);
    setErrorGeneral(null);
    try {
      const guardado = localStorage.getItem(CLAVE_DRAFT);
      if (guardado) {
        try {
          const draft = await api.obtenerBorrador(guardado);
          setDraftId(guardado);
          setDatos(draft.respuestas ?? {});
          setFaseActual(draft.faseActual ?? 0);
          setMaxFase(draft.faseActual ?? 0);
          return;
        } catch {
          localStorage.removeItem(CLAVE_DRAFT);
        }
      }
      const nuevo = await api.crearBorrador();
      localStorage.setItem(CLAVE_DRAFT, nuevo.id);
      setDraftId(nuevo.id);
      setDatos({});
      setFaseActual(0);
      setMaxFase(0);
    } catch {
      setErrorGeneral('No se pudo iniciar el pre-registro, intenta de nuevo');
    } finally {
      setCargando(false);
    }
  }, [draftId, cargando]);

  const guardarFase = useCallback(
    async (faseId: string, valores: ValoresFase) => {
      if (!draftId || !config) throw new Error('El borrador no está listo');
      const respuesta = await api.guardarFase(draftId, faseId, valores);
      setDatos((previos) => ({ ...previos, [faseId]: valores }));
      const indice = config.fases.findIndex((f) => f.id === faseId);
      const destino = Math.min(
        Math.max(maxFase, respuesta.faseActual ?? indice + 1),
        config.fases.length - 1
      );
      setMaxFase(destino);
      setFaseActual(destino);
    },
    [draftId, config, maxFase]
  );

  const irAFase = useCallback(
    (indice: number) => {
      if (indice >= 0 && indice <= maxFase) setFaseActual(indice);
    },
    [maxFase]
  );

  const enviar = useCallback(async () => {
    if (!draftId) throw new Error('El borrador no está listo');
    const respuesta = await api.enviarRegistro(draftId);
    setFolio(respuesta.folio);
    localStorage.removeItem(CLAVE_DRAFT);
  }, [draftId]);

  const reiniciar = useCallback(() => {
    localStorage.removeItem(CLAVE_DRAFT);
    setDraftId(null);
    setDatos({});
    setFaseActual(0);
    setMaxFase(0);
    setFolio(null);
    setErrorGeneral(null);
  }, []);

  const valor = useMemo(
    () => ({
      config,
      datos,
      faseActual,
      maxFase,
      draftId,
      folio,
      cargando,
      errorGeneral,
      iniciar,
      guardarFase,
      irAFase,
      enviar,
      reiniciar
    }),
    [config, datos, faseActual, maxFase, draftId, folio, cargando, errorGeneral, iniciar, guardarFase, irAFase, enviar, reiniciar]
  );

  return <WizardContext.Provider value={valor}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValor {
  const contexto = useContext(WizardContext);
  if (!contexto) throw new Error('useWizard debe usarse dentro de WizardProvider');
  return contexto;
}
