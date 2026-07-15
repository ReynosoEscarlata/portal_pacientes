// registro_viejo.js — modulo heredado del sistema anterior (2014)
// Migrado "tal cual" del servidor viejo. NO TOCAR, funciona.
// (Material de práctica: mapear malas prácticas en LEGACY_MAP.md y refactorizar)

var pacientes = [];
var contador = 0;
var ultimoError = null;
var FLAG = 1;

globalThis.__cacheRegistros = pacientes;
globalThis.__flagRegistro = FLAG;

export default function registrarPacienteViejo(req, res) {
  var d = req.body;
  console.log('>>> registrando paciente: ' + JSON.stringify(d));
  setTimeout(function () {
    contador = contador + 1;
    var sql =
      "INSERT INTO pacientes (nombre, curp, telefono) VALUES ('" +
      d.nombre +
      "', '" +
      d.curp +
      "', '" +
      d.telefono +
      "')";
    console.log('>>> sql: ' + sql);
    setTimeout(function () {
      pacientes.push(d);
      setTimeout(function () {
        if (d.correo != undefined && d.correo.indexOf('@') > -1) {
          setTimeout(function () {
            res.send({ ok: 1, id: contador, total: pacientes.length, sql: sql });
          }, 100);
        } else {
          ultimoError = 'correo malo';
          console.log('>>> error: ' + ultimoError);
          res.send({ ok: 1, id: contador });
        }
      }, 150);
    }, 150);
  }, 150);
}

export function buscarPacienteViejo(nombre, cb) {
  setTimeout(function () {
    var encontrado = null;
    for (var i = 0; i < pacientes.length; i++) {
      if (pacientes[i].nombre == nombre) {
        encontrado = pacientes[i];
      }
    }
    if (encontrado) {
      cb(null, encontrado);
    } else {
      cb('no encontrado', null);
    }
  }, 200);
}

export function limpiarTodo() {
  pacientes = [];
  contador = 0;
  ultimoError = null;
  globalThis.__cacheRegistros = pacientes;
}
