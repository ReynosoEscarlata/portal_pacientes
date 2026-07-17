import { z } from 'zod';
import { CLAVES_SEXO, CLAVES_ENTIDADES } from './catalogos.js';

export const CURP_REGEX =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;

function textoRequerido(etiqueta, max) {
  return z
    .string({ required_error: `${etiqueta} es obligatorio` })
    .trim()
    .min(1, `${etiqueta} es obligatorio`)
    .max(max, `${etiqueta} no debe exceder ${max} caracteres`);
}

function textoOpcional(max) {
  return z.string().trim().max(max).optional().default('');
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const fechaNacimiento = z
  .string({ required_error: 'La fecha de nacimiento es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'La fecha no es válida')
  .refine((v) => v <= hoyISO(), 'La fecha de nacimiento no puede ser futura')
  .refine((v) => v >= '1900-01-01', 'La fecha de nacimiento no es válida');

export const esquemaDatosPersonales = z
  .object({
    nombre: textoRequerido('El nombre', 80),
    primerApellido: textoRequerido('El primer apellido', 80),
    segundoApellido: textoOpcional(80),
    fechaNacimiento,
    sexo: z.enum(CLAVES_SEXO, { errorMap: () => ({ message: 'Selecciona una opción del catálogo de sexo' }) }),
    curp: z
      .string({ required_error: 'La CURP es obligatoria' })
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(CURP_REGEX, 'La CURP no tiene un formato válido')),
    telefono: z
      .string({ required_error: 'El teléfono es obligatorio' })
      .trim()
      .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos'),
    correo: z
      .string({ required_error: 'El correo es obligatorio' })
      .trim()
      .max(120, 'El correo no debe exceder 120 caracteres')
      .email('El correo no es válido')
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!CURP_REGEX.test(data.curp) || !/^\d{4}-\d{2}-\d{2}$/.test(data.fechaNacimiento)) {
      return;
    }

    const yymmddCurp = data.curp.slice(4, 10);
    const yymmddFecha =
      data.fechaNacimiento.slice(2, 4) + data.fechaNacimiento.slice(5, 7) + data.fechaNacimiento.slice(8, 10);
    if (yymmddCurp !== yymmddFecha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de nacimiento de la CURP no coincide con la fecha de nacimiento capturada',
        path: ['curp']
      });
    }

    const sexoCurp = data.curp.charAt(10);
    if (data.sexo !== 'NE' && sexoCurp !== data.sexo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El sexo de la CURP no coincide con el sexo capturado',
        path: ['curp']
      });
    }
  });

export const esquemaDomicilio = z
  .object({
    calle: textoRequerido('La calle', 120),
    numero: textoRequerido('El número', 20),
    colonia: textoRequerido('La colonia', 120),
    cp: z
      .string({ required_error: 'El código postal es obligatorio' })
      .trim()
      .regex(/^\d{5}$/, 'El código postal debe tener exactamente 5 dígitos'),
    municipio: textoRequerido('El municipio', 120),
    estado: z.enum(CLAVES_ENTIDADES, {
      errorMap: () => ({ message: 'Selecciona una entidad federativa del catálogo' })
    })
  })
  .strict();

export const esquemaDatosClinicos = z
  .object({
    motivoConsulta: z
      .string({ required_error: 'El motivo de consulta es obligatorio' })
      .trim()
      .min(5, 'Describe el motivo de consulta (mínimo 5 caracteres)')
      .max(600, 'El motivo de consulta no debe exceder 600 caracteres'),
    alergias: textoOpcional(600),
    medicamentosActuales: textoOpcional(600),
    antecedentes: textoOpcional(600)
  })
  .strict();

export const esquemaConsentimiento = z
  .object({
    aceptado: z.literal(true, {
      errorMap: () => ({ message: 'Debes otorgar tu consentimiento expreso para continuar' })
    }),
    versionAviso: z.string({ required_error: 'Falta la versión del aviso de privacidad' }).min(1)
  })
  .strict();

export const esquemasPorFase = {
  datos_personales: esquemaDatosPersonales,
  domicilio: esquemaDomicilio,
  datos_clinicos: esquemaDatosClinicos,
  consentimiento: esquemaConsentimiento
};
