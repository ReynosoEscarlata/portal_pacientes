import { obtenerRepositorio } from '../src/repositories/index.js';
import { sembrar } from '../src/seed/sembrar.js';

const repositorio = obtenerRepositorio();

console.log(`Sembrando pacientes ficticios en la fuente de datos "${repositorio.tipo}"...`);
const folios = await sembrar(repositorio);
console.log('Listo. Folios de demostración:');
for (const folio of folios) {
  console.log(` - ${folio}`);
}
await repositorio.cerrar();
