import { describe, it, expect } from 'vitest';
import { enmascararCurp } from './mask';

describe('enmascararCurp', () => {
  // Anti-regression coverage: this is the ONLY case that distinguishes
  // the bug (slice(0,5)) from the fix (slice(0,4)) — Math.max(0, n-5) and
  // Math.max(0, n-4) diverge only when curp.length > 4.
  it('enmascara todo excepto los primeros 4 caracteres (mirrors server/tests/arco.test.js)', () => {
    expect(enmascararCurp('PEGG850312MDFRRR04')).toBe('PEGG' + '*'.repeat(14));
  });

  it('regresa cadena vacía si no hay CURP', () => {
    expect(enmascararCurp('')).toBe('');
  });

  describe('casos límite documentados (NO son cobertura anti-regresión — ' +
    'slice(0,5) y slice(0,4) producen el mismo resultado cuando length <= 4)', () => {
    it('CURP de 4 caracteres queda completamente visible bajo ambas versiones', () => {
      expect(enmascararCurp('PEGG')).toBe('PEGG');
    });

    it('CURP más corta que 4 caracteres queda completamente visible bajo ambas versiones', () => {
      expect(enmascararCurp('PE')).toBe('PE');
    });
  });
});
