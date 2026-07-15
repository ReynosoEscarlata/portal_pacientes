# BACKLOG — ClinicConnect

User stories priorizadas (1 = mayor prioridad). Estimación en puntos de historia (Fibonacci).

---

## 1. Notificación de confirmación por correo — **5 pts**
**Como** paciente pre-registrado, **quiero** recibir mi folio por correo electrónico al finalizar, **para** no perderlo antes de mi cita.

**Criterios de aceptación**
- [ ] Al generar el folio se envía un correo con folio, fecha de creación y liga a la sección ARCO.
- [ ] El correo no incluye datos clínicos (minimización).
- [ ] Si el envío falla, el pre-registro se completa igualmente y el error queda registrado sin datos personales.

## 2. Panel de recepción — **8 pts**
**Como** personal de recepción, **quiero** buscar pre-registros por folio y marcar la llegada del paciente, **para** agilizar el flujo en mostrador.

**Criterios de aceptación**
- [ ] Vista protegida con autenticación básica del personal.
- [ ] Búsqueda por folio exacto; muestra datos personales completos y clínicos descifrados solo a personal autorizado.
- [ ] Estado del pre-registro: `pendiente → recibido → atendido`, con timestamp por transición.

## 3. Caducidad automática de borradores — **2 pts**
**Como** responsable de datos, **quiero** que los borradores inactivos se eliminen tras 30 días, **para** cumplir con el principio de conservación limitada.

**Criterios de aceptación**
- [ ] Tarea programada (o barrido al arrancar) que elimina drafts con `actualizado_en` > 30 días.
- [ ] La caducidad es configurable por variable de entorno.
- [ ] Se registra la cantidad eliminada (sin datos personales).

## 4. Derecho de Rectificación ARCO — **5 pts**
**Como** paciente, **quiero** corregir mis datos después de enviar el registro, **para** que mi expediente llegue correcto a la clínica.

**Criterios de aceptación**
- [ ] Con folio + fecha de nacimiento puedo editar datos personales y domicilio.
- [ ] Cada rectificación guarda bitácora (campo modificado, timestamp) sin valores anteriores en texto plano.
- [ ] La CURP solo es editable si vuelve a pasar la validación de formato.

## 5. Validación cruzada CURP ↔ datos capturados — **3 pts**
**Como** clínica, **quiero** que la CURP se valide contra fecha de nacimiento y sexo capturados, **para** detectar errores de dedo antes de la recepción.

**Criterios de aceptación**
- [ ] Si la fecha embebida en la CURP no coincide con `fechaNacimiento`, el backend regresa error de validación con mensaje claro.
- [ ] Lo mismo para el sexo (posición 11) cuando sea H/M.
- [ ] Tests unitarios de ambos cruces.

## 6. Retomar borrador desde otro dispositivo — **5 pts**
**Como** paciente, **quiero** recibir una liga o código para continuar mi borrador en otro dispositivo, **para** empezar en el celular y terminar en la computadora.

**Criterios de aceptación**
- [ ] Puedo solicitar un código de recuperación asociado a mi correo.
- [ ] El código expira (≤ 24 h) y es de un solo uso.
- [ ] Sin el código, el borrador no es accesible desde otro dispositivo.

## 7. Exportar a expediente clínico electrónico (NOM-024) — **13 pts**
**Como** clínica, **quiero** exportar los pre-registros en un formato interoperable (HL7 CDA / FHIR), **para** integrarlos al expediente clínico electrónico.

**Criterios de aceptación**
- [ ] Endpoint autenticado que exporta un pre-registro como FHIR `Patient` + `Condition` (motivo).
- [ ] Mapeo de catálogos (sexo, entidad) a los códigos del estándar elegido.
- [ ] Documento de mapeo de campos incluido en `/docs`.

## 8. Accesibilidad WCAG 2.1 AA — **5 pts**
**Como** paciente con discapacidad visual, **quiero** navegar el wizard con lector de pantalla y teclado, **para** completar mi pre-registro sin ayuda.

**Criterios de aceptación**
- [ ] Navegación completa por teclado (focus visible en todos los controles).
- [ ] Errores de validación anunciados por `aria-live` / `role="alert"`.
- [ ] Contraste verificado para la paleta actual; auditoría Lighthouse a11y ≥ 95.

## 9. Comprobante PDF del pre-registro — **3 pts**
**Como** paciente, **quiero** descargar un comprobante PDF con mi folio y un resumen enmascarado, **para** presentarlo impreso en recepción.

**Criterios de aceptación**
- [ ] Botón "Descargar comprobante" en la pantalla de folio.
- [ ] El PDF incluye folio, nombre, fecha y datos enmascarados; nunca datos clínicos.
- [ ] Generación en el cliente (sin enviar datos a servicios externos).

## 10. Captura de motivo con catálogo CIE-10 — **8 pts**
**Como** personal médico, **quiero** que el motivo de consulta se apoye en un catálogo CIE-10 con autocompletado, **para** estandarizar la información clínica.

**Criterios de aceptación**
- [ ] Autocompletado con búsqueda por texto sobre un subconjunto CIE-10.
- [ ] Se guarda código + descripción; el texto libre se mantiene como complemento.
- [ ] El catálogo se sirve desde el backend con caché.

## 11. Bitácora de accesos a datos sensibles — **5 pts**
**Como** oficial de privacidad, **quiero** una bitácora de cada consulta/descifrado de datos clínicos, **para** auditar el acceso conforme a la LFPDPPP.

**Criterios de aceptación**
- [ ] Cada consulta ARCO y (futuro) acceso de recepción genera un evento: quién, cuándo, folio, propósito.
- [ ] La bitácora no contiene los datos sensibles consultados.
- [ ] Endpoint/reporte de auditoría filtrable por rango de fechas.

## 12. Soporte para menores de edad (tutor legal) — **5 pts**
**Como** madre/padre/tutor, **quiero** pre-registrar a un menor agregando mis datos como responsable, **para** cumplir el requisito de consentimiento del tutor.

**Criterios de aceptación**
- [ ] Si la fecha de nacimiento indica minoría de edad, aparece una sub-fase de datos del tutor (dinámica, vía `phases.config.json`).
- [ ] El consentimiento registra que fue otorgado por el tutor (nombre y parentesco).
- [ ] Validación backend: menor sin tutor ⇒ error 422.
