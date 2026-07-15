import { useEffect } from 'react';
import { useWizard } from '../context/WizardContext';
import Wizard from '../components/wizard/Wizard';

export default function PreRegistro() {
  const { draftId, folio, iniciar, errorGeneral, cargando } = useWizard();

  useEffect(() => {
    if (!draftId && !folio) {
      void iniciar();
    }
  }, [draftId, folio, iniciar]);

  if (errorGeneral) {
    return (
      <div className="card">
        <p className="campo__error" role="alert">{errorGeneral}</p>
      </div>
    );
  }

  if (cargando && !draftId) {
    return <div className="card">Preparando tu pre-registro…</div>;
  }

  return <Wizard />;
}
