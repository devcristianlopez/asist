const form = document.getElementById("formAsistencia");
const nombreInput = document.getElementById("nombre");
const errorNombre = document.getElementById("errorNombre");
const tablaBody = document.querySelector("#tablaAsistentes tbody");
const btnDescargar = document.getElementById("btnDescargar");
const btnLimpiar = document.getElementById("btnLimpiar");
const emptyState = document.getElementById("emptyState");

const STORAGE_KEY = "asistencia-registros";

let registros = cargarRegistros();

renderTabla();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const nombre = nombreInput.value.trim();
  const esValido = validarNombre(nombre);

  if (!esValido) {
    mostrarError("Ingresa un nombre válido (mínimo 3 caracteres).");
    nombreInput.classList.add("invalid");
    nombreInput.focus();
    return;
  }

  limpiarError();
  nombreInput.classList.remove("invalid");

  const ahora = new Date();
  const registro = {
    id: Date.now().toString(),
    nombre: capitalizarNombre(nombre),
    fecha: formatearFecha(ahora),
    hora: formatearHora(ahora),
  };

  registros.push(registro);
  guardarRegistros();
  form.reset();
  nombreInput.focus();

  renderTabla(registro.id);
});

btnDescargar.addEventListener("click", descargarCSV);
btnLimpiar.addEventListener("click", limpiarLista);

nombreInput.addEventListener("input", () => {
  if (nombreInput.value.trim().length >= 3) {
    limpiarError();
    nombreInput.classList.remove("invalid");
  }
});

function validarNombre(valor) {
  return valor.length >= 3;
}

function mostrarError(mensaje) {
  errorNombre.textContent = mensaje;
}

function limpiarError() {
  errorNombre.textContent = "";
}

function capitalizarNombre(valor) {
  return valor
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra) => {
      const minus = palabra.toLowerCase();
      return minus.charAt(0).toUpperCase() + minus.slice(1);
    })
    .join(" ");
}

function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-ES");
}

function formatearHora(fecha) {
  return fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderTabla(destacadoId = null) {
  tablaBody.innerHTML = "";

  if (registros.length === 0) {
    emptyState.classList.remove("hidden");
    btnDescargar.disabled = true;
    btnLimpiar.disabled = true;
    return;
  }

  emptyState.classList.add("hidden");
  btnDescargar.disabled = false;
  btnLimpiar.disabled = false;

  registros.forEach((registro, indice) => {
    const fila = document.createElement("tr");
    if (destacadoId && registro.id === destacadoId) {
      fila.classList.add("success-flash");
    }

    const celdaNum = document.createElement("td");
    celdaNum.textContent = indice + 1;

    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = registro.nombre;

    const celdaFecha = document.createElement("td");
    celdaFecha.textContent = registro.fecha;

    const celdaHora = document.createElement("td");
    celdaHora.textContent = registro.hora;

    fila.append(celdaNum, celdaNombre, celdaFecha, celdaHora);
    tablaBody.appendChild(fila);
  });
}

function descargarCSV() {
  if (registros.length === 0) return;

  const encabezados = ["Nombre", "Fecha", "Hora"];
  const filas = registros.map((registro) => [
    escaparCsv(registro.nombre),
    escaparCsv(registro.fecha),
    escaparCsv(registro.hora),
  ]);

  const contenido = [encabezados, ...filas]
    .map((fila) => fila.map((campo) => `"${campo}"`).join(","))
    .join("\r\n");

  const blob = new Blob(["\ufeff" + contenido], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fechaArchivo = new Date().toISOString().slice(0, 10);

  enlace.href = url;
  enlace.download = `asistencia-${fechaArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

function escaparCsv(campo) {
  const texto = String(campo);
  if (texto.includes('"') || texto.includes(",") || texto.includes("\n") || texto.includes("\r")) {
    return texto.replace(/"/g, '""');
  }
  return texto;
}

function limpiarLista() {
  const confirmar = confirm("¿Seguro que deseas borrar todos los registros de esta lista?");
  if (!confirmar) return;

  registros = [];
  guardarRegistros();
  renderTabla();
  nombreInput.focus();
}

function cargarRegistros() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado);
    return Array.isArray(parseado) ? parseado : [];
  } catch (error) {
    console.warn("No se pudieron cargar los registros guardados", error);
    return [];
  }
}

function guardarRegistros() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  } catch (error) {
    console.warn("No se pudieron guardar los registros", error);
  }
}