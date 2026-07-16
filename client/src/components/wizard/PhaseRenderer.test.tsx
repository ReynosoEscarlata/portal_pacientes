import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderConWizard } from '../../test-utils/renderConWizard';
import PhaseRenderer from './PhaseRenderer';
import type { FaseConfig } from '../../types';

// Isolated fase with ONLY a curp field — avoids needing to satisfy the
// other required fields (nombre, telefono, etc.) of the real
// datos_personales fase. The pattern below is the SAME corrected regex
// written into server/src/config/phases.config.json in Task 1 (JSON-escaped form).
const faseCurpSolo: FaseConfig = {
  id: 'datos_personales',
  titulo: 'Datos personales',
  icono: '👤',
  tipo: 'form',
  campos: [
    {
      nombre: 'curp',
      etiqueta: 'CURP',
      tipo: 'text',
      requerido: true,
      maxLength: 18,
      pattern:
        '^[A-Z][AEIOUX][A-Z]{2}\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\\d$'
    }
  ]
};

describe('PhaseRenderer — validación de patrón CURP', () => {
  it('accepts a valid post-2000 CURP', async () => {
    const guardarFase = vi.fn().mockResolvedValue(undefined);
    renderConWizard(<PhaseRenderer fase={faseCurpSolo} />, { guardarFase });

    await userEvent.type(screen.getByLabelText(/curp/i), 'MAPA000115HDFRRLA1');
    await userEvent.click(screen.getByRole('button', { name: /guardar y continuar/i }));

    expect(guardarFase).toHaveBeenCalledWith('datos_personales', { curp: 'MAPA000115HDFRRLA1' });
  });

  it('rejects a malformed CURP before calling guardarFase', async () => {
    const guardarFase = vi.fn();
    renderConWizard(<PhaseRenderer fase={faseCurpSolo} />, { guardarFase });

    await userEvent.type(screen.getByLabelText(/curp/i), 'NOVALIDA123');
    await userEvent.click(screen.getByRole('button', { name: /guardar y continuar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('CURP no tiene un formato válido');
    expect(guardarFase).not.toHaveBeenCalled();
  });

  // Accepted, in-scope behavior (RESEARCH Assumption A2 / UI-SPEC case-sensitivity
  // edge): validarCampo does NOT uppercase before testing the pattern, while the
  // backend Zod schema does (.transform(v => v.toUpperCase())). A lowercase but
  // otherwise structurally-valid CURP is therefore rejected client-side even
  // though the backend would accept it. This is intended, not a regression.
  it('lowercase structurally-valid CURP is rejected client-side (accepted A2 behavior, not a regression)', async () => {
    const guardarFase = vi.fn();
    renderConWizard(<PhaseRenderer fase={faseCurpSolo} />, { guardarFase });

    await userEvent.type(screen.getByLabelText(/curp/i), 'mapa000115hdfrrla1');
    await userEvent.click(screen.getByRole('button', { name: /guardar y continuar/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('CURP no tiene un formato válido');
    expect(guardarFase).not.toHaveBeenCalled();
  });
});
