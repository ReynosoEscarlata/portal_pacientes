import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { useWizard } from '../context/WizardContext';

// vi.mock must be called at module scope in the file that ultimately gets
// imported before the real WizardContext module — placing it here, in the
// shared harness, works because Vitest hoists vi.mock() above this file's
// own imports, and the mock registration is shared across the test file's
// module graph for that run.
vi.mock('../context/WizardContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/WizardContext')>();
  return { ...actual, useWizard: vi.fn() };
});

// Deriving the mock's type via ReturnType<typeof useWizard> works even
// though WizardContextValor itself is never exported — TS can reference
// an unexported type structurally without naming it directly.
type ContextoWizard = ReturnType<typeof useWizard>;

function contextoBase(overrides: Partial<ContextoWizard> = {}): ContextoWizard {
  return {
    config: null,
    datos: {},
    faseActual: 0,
    maxFase: 0,
    draftId: 'draft-test',
    folio: null,
    cargando: false,
    errorGeneral: null,
    iniciar: vi.fn(),
    guardarFase: vi.fn().mockResolvedValue(undefined),
    irAFase: vi.fn(),
    enviar: vi.fn(),
    reiniciar: vi.fn(),
    ...overrides
  };
}

export function renderConWizard(ui: ReactElement, overrides: Partial<ContextoWizard> = {}) {
  vi.mocked(useWizard).mockReturnValue(contextoBase(overrides));
  return render(ui);
}
