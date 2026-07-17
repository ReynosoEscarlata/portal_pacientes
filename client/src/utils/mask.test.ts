import { describe, it, expect } from 'vitest';
import { enmascararCurp, enmascararTelefono, enmascararCorreo, iniciales } from './mask';

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

describe('enmascararTelefono', () => {
  it('enmascara todo excepto los últimos 4 dígitos', () => {
    expect(enmascararTelefono('5512345678')).toBe('******5678');
  });

  it('regresa solo asteriscos si el teléfono tiene 4 caracteres o menos', () => {
    expect(enmascararTelefono('1234')).toBe('****');
    expect(enmascararTelefono('12')).toBe('**');
  });

  it('regresa cadena vacía si no hay teléfono', () => {
    expect(enmascararTelefono('')).toBe('');
  });
});

describe('enmascararCorreo', () => {
  it('enmascara el usuario dejando visibles los primeros 2 caracteres', () => {
    expect(enmascararCorreo('maria@example.com')).toBe('ma***@example.com');
  });

  it('regresa *** si el correo no tiene arroba', () => {
    expect(enmascararCorreo('sin-arroba')).toBe('***');
  });
});

describe('iniciales', () => {
  it('regresa las iniciales en mayúsculas de nombre y apellido', () => {
    expect(iniciales('María', 'Pérez')).toBe('MP');
  });

  it('ignora espacios en blanco al inicio antes de tomar la primera letra', () => {
    expect(iniciales('  María', '  Pérez')).toBe('MP');
  });

  it('regresa "?" si nombre y apellido están vacíos', () => {
    expect(iniciales('', '')).toBe('?');
  });
});
