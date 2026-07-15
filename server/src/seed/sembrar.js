import { cifrar } from '../crypto/cipher.js';
import { configFases } from '../config/fases.js';

// Pacientes ficticios para demos y pruebas manuales (ningún dato es real).
export const PACIENTES_SEMILLA = [
  {
    folio: 'CC-2026-DEMO01',
    datosPersonales: {
      nombre: 'María Guadalupe',
      primerApellido: 'Pérez',
      segundoApellido: 'García',
      fechaNacimiento: '1985-03-12',
      sexo: 'M',
      curp: 'PEGG850312MDFRRR04',
      telefono: '5512345678',
      correo: 'maria.demo@example.com'
    },
    domicilio: {
      calle: 'Av. Siempre Viva',
      numero: '742',
      colonia: 'Centro',
      cp: '06000',
      municipio: 'Cuauhtémoc',
      estado: 'DF'
    },
    datosClinicos: {
      motivoConsulta: 'Dolor de cabeza recurrente desde hace dos semanas',
      alergias: 'Penicilina',
      medicamentosActuales: 'Paracetamol ocasional',
      antecedentes: 'Hipertensión controlada'
    }
  },
  {
    folio: 'CC-2026-DEMO02',
    datosPersonales: {
      nombre: 'Juan Carlos',
      primerApellido: 'Hernández',
      segundoApellido: 'López',
      fechaNacimiento: '1978-11-30',
      sexo: 'H',
      curp: 'HELJ781130HMCRPN05',
      telefono: '5598765432',
      correo: 'juan.demo@example.com'
    },
    domicilio: {
      calle: 'Calle de la Rosa',
      numero: '12-B',
      colonia: 'Jardines',
      cp: '50110',
      municipio: 'Toluca',
      estado: 'MC'
    },
    datosClinicos: {
      motivoConsulta: 'Revisión anual y control de glucosa',
      alergias: 'Ninguna',
      medicamentosActuales: 'Metformina 850 mg',
      antecedentes: 'Diabetes tipo 2 diagnosticada en 2020'
    }
  },
  {
    folio: 'CC-2026-DEMO03',
    datosPersonales: {
      nombre: 'Ana Sofía',
      primerApellido: 'Ramírez',
      segundoApellido: 'Cruz',
      fechaNacimiento: '1992-07-04',
      sexo: 'M',
      curp: 'RACA920704MJCMRN01',
      telefono: '3311224455',
      correo: 'ana.demo@example.com'
    },
    domicilio: {
      calle: 'Prol. Independencia',
      numero: 'S/N',
      colonia: 'Americana',
      cp: '44160',
      municipio: 'Guadalajara',
      estado: 'JC'
    },
    datosClinicos: {
      motivoConsulta: 'Dolor lumbar tras actividad física',
      alergias: 'Polen',
      medicamentosActuales: '',
      antecedentes: 'Sin antecedentes relevantes'
    }
  }
];

export async function sembrar(repositorio) {
  const folios = [];
  for (const paciente of PACIENTES_SEMILLA) {
    if (await repositorio.existeFolio(paciente.folio)) {
      folios.push(paciente.folio);
      continue;
    }
    await repositorio.crearRegistro({
      folio: paciente.folio,
      datosPersonales: paciente.datosPersonales,
      domicilio: paciente.domicilio,
      datosClinicos: cifrar(paciente.datosClinicos),
      consentimiento: {
        aceptado: true,
        versionAviso: configFases.versionAviso,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1'
      },
      creadoEn: new Date().toISOString()
    });
    folios.push(paciente.folio);
  }
  return folios;
}
