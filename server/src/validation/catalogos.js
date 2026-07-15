// Catálogos alineados a claves estándar (RENAPO / NOM-024).

export const SEXO = [
  { clave: 'H', descripcion: 'Hombre' },
  { clave: 'M', descripcion: 'Mujer' },
  { clave: 'NE', descripcion: 'No especificado' }
];

export const ENTIDADES = [
  { clave: 'AS', descripcion: 'Aguascalientes' },
  { clave: 'BC', descripcion: 'Baja California' },
  { clave: 'BS', descripcion: 'Baja California Sur' },
  { clave: 'CC', descripcion: 'Campeche' },
  { clave: 'CS', descripcion: 'Chiapas' },
  { clave: 'CH', descripcion: 'Chihuahua' },
  { clave: 'DF', descripcion: 'Ciudad de México' },
  { clave: 'CL', descripcion: 'Coahuila' },
  { clave: 'CM', descripcion: 'Colima' },
  { clave: 'DG', descripcion: 'Durango' },
  { clave: 'GT', descripcion: 'Guanajuato' },
  { clave: 'GR', descripcion: 'Guerrero' },
  { clave: 'HG', descripcion: 'Hidalgo' },
  { clave: 'JC', descripcion: 'Jalisco' },
  { clave: 'MC', descripcion: 'México' },
  { clave: 'MN', descripcion: 'Michoacán' },
  { clave: 'MS', descripcion: 'Morelos' },
  { clave: 'NT', descripcion: 'Nayarit' },
  { clave: 'NL', descripcion: 'Nuevo León' },
  { clave: 'OC', descripcion: 'Oaxaca' },
  { clave: 'PL', descripcion: 'Puebla' },
  { clave: 'QT', descripcion: 'Querétaro' },
  { clave: 'QR', descripcion: 'Quintana Roo' },
  { clave: 'SP', descripcion: 'San Luis Potosí' },
  { clave: 'SL', descripcion: 'Sinaloa' },
  { clave: 'SR', descripcion: 'Sonora' },
  { clave: 'TC', descripcion: 'Tabasco' },
  { clave: 'TS', descripcion: 'Tamaulipas' },
  { clave: 'TL', descripcion: 'Tlaxcala' },
  { clave: 'VZ', descripcion: 'Veracruz' },
  { clave: 'YN', descripcion: 'Yucatán' },
  { clave: 'ZS', descripcion: 'Zacatecas' },
  { clave: 'NE', descripcion: 'Nacido en el extranjero' }
];

export const CLAVES_SEXO = SEXO.map((s) => s.clave);
export const CLAVES_ENTIDADES = ENTIDADES.map((e) => e.clave);
