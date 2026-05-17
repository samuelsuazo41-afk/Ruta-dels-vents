const CATLINGO_CACHE = 'catlingo-v10';
let capitolActual = null;
let pasoIndex = 0;
let seny = parseInt(localStorage.getItem('seny') || 0);
let rauxa = parseInt(localStorage.getItem('rauxa') || 0);
let monedas = parseInt(localStorage.getItem('monedas') || 0);

document.addEventListener('DOMContentLoaded', () => {
  actualizarUIStats();
  cargarMenuCapitulos();
  setupNavegacion();
  setupModoRepas();
  actualizarRacha();
});

// ====== B. Seny/Rauxa afectan el diálogo ======
function getPasoModificado(paso, capitolId) {
  const pasoMod = JSON.parse(JSON.stringify(paso));

  // Vic - iaia habla más lento si Seny > 70
  if (capitolId === 'vic_01' && pasoMod.npc.id === 'vell' && seny > 70) {
    pasoMod.npc.frase = "A veure, tranquil... te ho dic a poc a poc: No compri res sense regatejar abans.";
    pasoMod.pistaExtra = "Pista: 'No compri' va amb subjuntiu per consell.";
  }

  // Girona - chaval en slang si Rauxa > 70
  if (capitolId === 'girona_01' && pasoMod.npc.id === 'chaval' && rauxa > 70) {
    pasoMod.npc.frase = "Ostres tiu, vine per aquí que t'ensenyo un lloc flipant!";
    pasoMod.escenari = "El chaval et porta a un carreró secret. Desbloquejas 'Carrer Amagat'.";
  }

  return pasoMod;
}

// ====== Cargar capítulo ======
async function cargarCapitol(id) {
  const res = await fetch(`/data/${id}.json`);
  capitolActual = await res.json();
  pasoIndex = 0;
  mostrarPaso();
}

function mostrarPaso() {
  if (!capitolActual || pasoIndex >= capitolActual.passos.length) {
    finalizarCapitol();
    return;
  }

  let paso = getPasoModificado(capitolActual.passos[pasoIndex], capitolActual.id);
  
  document.getElementById('escenari').textContent = paso.escenari;
  document.getElementById('npcFrase').innerHTML = `${paso.npc.frase} <span class="audio-btn" onclick="parlar('${paso.npc.frase}')">🔊</span>`;
  
  if (paso.pistaExtra) {
    document.getElementById('pistaExtra').textContent = paso.pistaExtra;
    document.getElementById('pistaExtra').style.display = 'block';
  } else {
    document.getElementById('pistaExtra').style.display = 'none';
  }

  const opcionesDiv = document.getElementById('opcions');
  opcionesDiv.innerHTML = '';
  paso.opcions.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.textContent = op.text;
    btn.onclick = () => seleccionarOpcion(op, paso);
    opcionesDiv.appendChild(btn);
  });
}

function seleccionarOpcion(opcion, paso) {
  if (opcion.correcte) {
    seny += opcion.seny || 0;
    rauxa += opcion.rauxa || 0;
    monedas += opcion.coins || 0;
    guardarStats();
    mostrarFeedback(opcion.feedback_ca, 'correcte');
  } else {
    guardarFallada(paso);
    mostrarFeedback(opcion.feedback_ca, 'incorrecte');
  }
  
  setTimeout(() => {
    pasoIndex++;
    mostrarPaso();
  }, 1500);
}

function guardarFallada(paso) {
  let falladas = JSON.parse(localStorage.getItem('falladas') || '[]');
  falladas.push(paso);
  localStorage.setItem('falladas', JSON.stringify(falladas));
}

function finalizarCapitol() {
  let completados = JSON.parse(localStorage.getItem('capitolsCompletats') || '[]');
  if (!completados.includes(capitolActual.id)) {
    completados.push(capitolActual.id);
    localStorage.setItem('capitolsCompletats', JSON.stringify(completados));
  }
  document.getElementById('pantallaFinal').style.display = 'block';
}

// ====== D. Audio Web Speech API ======
function parlar(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ca-ES';
    utter.rate = 0.9;
    speechSynthesis.speak(utter);
  }
}

// ====== C. Modo Repàs ======
function setupModoRepas() {
  const btn = document.getElementById('btnRepas');
  if (btn) {
    btn.addEventListener('click', iniciarRepas);
  }
}

function iniciarRepas() {
  let capitolsCompletats = JSON.parse(localStorage.getItem('capitolsCompletats') || '[]');
  let todasPreguntas = [];
  
  capitolsCompletats.forEach(id => {
    const data = localStorage.getItem(id);
    if (data) {
      const capitol = JSON.parse(data);
      todasPreguntas = todasPreguntas.concat(capitol.passos);
    }
  });

  let falladas = JSON.parse(localStorage.getItem('falladas') || '[]');
  todasPreguntas = [...todasPreguntas, ...falladas, ...falladas];

  const repas = todasPreguntas.sort(() => 0.5 - Math.random()).slice(0, 5);
  mostrarRepas(repas);
}

function mostrarRepas(preguntas) {
  const container = document.getElementById('repasContainer');
  container.innerHTML = '<h3>Repàs Ràpid</h3>';
  preguntas.forEach((p, i) => {
    const div = document.createElement('div');
    div.innerHTML = `<p><strong>${i+1}.</strong> ${p.pregunta}</p>`;
    container.appendChild(div);
  });
}

// ====== Stats y UI ======
function guardarStats() {
  localStorage.setItem('seny', seny);
  localStorage.setItem('rauxa', rauxa);
  localStorage.setItem('monedas', monedas);
  actualizarUIStats();
}

function actualizarUIStats() {
  document.getElementById('seny').textContent = seny;
  document.getElementById('rauxa').textContent = rauxa;
  document.getElementById('monedas').textContent = monedas;
}

// ====== Racha de dies ======
function actualizarRacha() {
  const hoy = new Date().toDateString();
  const ultimoDia = localStorage.getItem('ultimoDia');
  
  if (ultimoDia !== hoy) {
    const racha = parseInt(localStorage.getItem('racha') || 0);
    if (ultimoDia && new Date(hoy) - new Date(ultimoDia) === 86400000) {
      localStorage.setItem('racha', racha + 1);
    } else {
      localStorage.setItem('racha', 1);
    }
    localStorage.setItem('ultimoDia', hoy);
  }
  
  const rachaActual = localStorage.getItem('racha');
  document.getElementById('racha').textContent = rachaActual;
  
  if (rachaActual >= 7) {
    document.getElementById('sticker7dies').style.display = 'block';
  }
}

// ====== Navegación pestañas ======
function setupNavegacion() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById(tab).style.display = 'block';
    });
  });
}

function cargarMenuCapitulos() {
  const capitulos = [
    {id: 'capitol_01_barcelona', nombre: 'Barcelona'},
    {id: 'capitol_02_girona', nombre: 'Girona'},
    {id: 'capitol_03_tarragona', nombre: 'Tarragona'},
    {id: 'capitol_04_lleida', nombre: 'Lleida'},
    {id: 'capitol_05_vic', nombre: 'Vic'}
  ];
  
  const menu = document.getElementById('menuCapitulos');
  const completados = JSON.parse(localStorage.getItem('capitolsCompletats') || '[]');
  
  capitulos.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = completados.includes(c.id) ? `✅ ${c.nombre}` : c.nombre;
    btn.onclick = () => cargarCapitol(c.id);
    menu.appendChild(btn);
  });
      }
