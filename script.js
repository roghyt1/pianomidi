let fileInput, pianoContainer, noteDisplay, piano, audioContext, keyMap, audioBuffers, audioSources, durationRatio, playbackTimeout;

// Fonction d'initialisation de l'application
function init() {
  // Récupération des éléments du DOM
  fileInput = document.getElementById("file-input");
  pianoContainer = document.getElementById("piano-container");
  noteDisplay = document.getElementById("note-display");
  piano = document.getElementById("piano");

  // Initialisation de l'audio context
  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Chargement des sons des touches de piano
  keyMap = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  audioBuffers = {};
  audioSources = {};
  loadSounds();

  // Gestion de l'upload de fichier
  fileInput.addEventListener("change", handleFileUpload);
}

// Fonction de chargement des sons des touches de piano
function loadSounds() {
  let url = "https://cdn.jsdelivr.net/gh/danigb/soundfont-player@2.1.2/sounds/salamander/";

  for (let i = 0; i < 88; i++) {
    let note = keyMap[i % 12] + Math.floor(i / 12);
    let audioUrl = url + note + ".mp3";

    // Chargement du son de la touche
    fetch(audioUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => audioContext.decodeAudioData(buffer))
      .then(audioBuffer => audioBuffers[note] = audioBuffer);
  }
}

// Fonction de gestion de l'upload de fichier
function handleFileUpload(event) {
  // Récupération du fichier MIDI
  let file = event.target.files[0];

  // Extraction des notes et du rythme du fichier MIDI
  MidiConvert.load(file, { "PPQ": 480 }).then(midi => {
    let notes = [];
    midi.tracks.forEach(track => notes.push(...track.notes));

    // Tri des notes par ordre chronologique
    notes.sort((a, b) => a.time - b.time);

    // Calcul de la durée totale du morceau
    let duration = notes[notes.length - 1].time + notes[notes.length - 1].duration;

    // Calcul du ratio de durée entre le fichier MIDI et l'animation de défilement des notes
    durationRatio = duration / (noteDisplay.clientWidth / 10);

    // Affichage du clavier de piano
    pianoContainer.style.display = "block";

    // Génération du clavier de piano
    generatePiano();

    // Démarrage de l'animation de défilement des notes
    startPlayback(notes);
  });
}

// Fonction de génération du clavier de piano

function generatePiano() {
  for (let i = 0; i < 88; i++) {
    let note = keyMap[i % 12] + Math.floor(i / 12);
    let key = document.createElement("div");
    key.classList.add("key");
    if (note.indexOf("#") === -1) {
      key.classList.add("white");
      key.style.left = ((i / 88) * 100) + "%";
      key.style.width = (1 / 88 * 100) + "%";
      key.addEventListener("mousedown", () => playNoteAudio(note));
      key.addEventListener("touchstart", () => playNoteAudio(note));
    } else {
      key.classList.add("black");
      let whiteNoteIndex = i - 1;
      key.style.left = (((whiteNoteIndex / 88) * 100) + (0.5 / 88 * 100)) + "%";
      key.style.width = (1 / 88 * 100 * 0.6) + "%";
      key.addEventListener("mousedown", () => playNoteAudio(note));
      key.addEventListener("touchstart", () => playNoteAudio(note));
      }
    piano.appendChild(key);
  }
}

// Fonction de démarrage de l'animation de défilement des notes
function startPlayback(notes) {
let currentNoteIndex = 0;
let noteDisplayWidth = noteDisplay.clientWidth;

// Fonction récursive pour jouer les notes et faire défiler l'animation
function playNextNote() {
let currentNote = notes[currentNoteIndex];
let currentNoteStart = currentNote.time;
let currentNoteEnd = currentNoteStart + currentNote.duration;
let currentNoteDisplay = document.createElement("div");
currentNoteDisplay.classList.add("note");
currentNoteDisplay.style.left = ((currentNoteStart / durationRatio) + (noteDisplayWidth / 10)) + "px";
currentNoteDisplay.style.width = ((currentNote.duration / durationRatio) - (noteDisplayWidth / 10)) + "px";
noteDisplay.appendChild(currentNoteDisplay);

// Déclenchement de la note audio
playNoteAudio(currentNote.name);

// Suppression de la note affichée après son temps de durée
setTimeout(() => {
  noteDisplay.removeChild(currentNoteDisplay);
}, currentNote.duration / durationRatio);

// Passage à la note suivante
currentNoteIndex++;
if (currentNoteIndex < notes.length) {
  let nextNote = notes[currentNoteIndex];
  let nextNoteStart = nextNote.time;
  let timeUntilNextNote = nextNoteStart - currentNoteEnd;
  playbackTimeout = setTimeout(playNextNote, timeUntilNextNote / durationRatio);
}
}

// Démarrage de l'animation de défilement des notes
playNextNote();
}

// Fonction de lecture de la note audio
function playNoteAudio(noteName) {
// Arrêt de la note si elle est déjà en cours de lecture
if (audioSources[noteName]) {
audioSources[noteName].stop();
}

// Création d'un nouveau noeud de source audio
let source = audioContext.createBufferSource();
source.buffer = audioBuffers[noteName];

// Connexion du noeud de source audio à la sortie audio
source.connect(audioContext.destination);

// Lecture de la note audio
source.start();

// Ajout de la source audio à la liste des sources en cours de lecture
audioSources[noteName] = source;
}
