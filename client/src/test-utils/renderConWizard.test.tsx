import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderConWizard } from './renderConWizard';
import PhaseRenderer from '../components/wizard/PhaseRenderer';
import type { FaseConfig } from '../types';

// Isolated single-field fixture — proves the harness alone can render
// PhaseRenderer without a real WizardProvider/network fetch.
const faseCurpSolo: FaseConfig = {
  id: 'datos_personales',
  titulo: 'Datos personales',
  icono: '👤',
  tipo: 'form',
  campos: [
    { nombre: 'curp', etiqueta: 'CURP', tipo: 'text', requerido: true, maxLength: 18 }
  ]
};

describe('renderConWizard (smoke test)', () => {
  // Confirms RESEARCH.md Open Question 1: the shared-file vi.mock('../context/WizardContext')
  // declared inside renderConWizard.tsx applies to this test file, which only
  // imports the harness (not WizardContext directly) — proving the mock is
  // hoisted/shared across the importing test file's module graph.
  it('renders PhaseRenderer without a real WizardProvider or network fetch', () => {
    renderConWizard(<PhaseRenderer fase={faseCurpSolo} />, { guardarFase: vi.fn() });

    expect(screen.getByRole('button', { name: /guardar y continuar/i })).toBeInTheDocument();
  });
});
