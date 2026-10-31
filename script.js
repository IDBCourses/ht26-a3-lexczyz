/*
 * IDB Programming: A3 — a musical instrument
 *
 * All of the code for your instrument goes in this file. It's split into sections:
 *   settings — the "fixed" parts of your program
 *   state    — the parts of your program that change over time
 *   sound    — the Tone.js instruments and effects
 *   update   — updates the state every 100ms, if necessary
 *   use      — uses the state to make sound and shapes every 100ms, if necessary
 *   controls — what happens when the player uses the pointer
 *   setup    — starts everything
 *
 * The pointer events change the state. update() and use() each run every
 * 100ms, in a loop:
 *   1. update: change the state, e.g. based on time or on the pointer's movement
 *   2. use:    make sound and move shapes, based on the state
 *
 * Shapes come from shape.js: createShape() makes one, and its methods
 * (setPosition, setSize, setColour ...) change it.
 *
 * Tone.js documentation: https://tonejs.github.io/docs/15.1.22/
 */

import { createShape } from "./shape.js";

// ---------- Settings ----------
// Settings variables should contain all of the "fixed" parts of your programs
// For example: which notes you can play, how fast things move, the tempo.

//shared settings of kiki and bouba
const settings = {
  //shape size: default, min and max
  initialSize: 350,
  minSize: 5,
  maxSize: 500,

  //stroke size: default, min, and max
  initialStroke: 4,
  minStroke: 1,
  maxStroke: 50,

  //min and max frequency
  minFrequency: 50,
  maxFrequency: 1000,

  //starts with this frequency
  initialKikiFrequency: 220,
  initialBoubaFrequency: 330,
  updateInterval: 100,

  //different rhythms
  kikiInterval: 100,
  boubaInterval: 300
};

// ---------- State ----------
// State variables are the parts of your program that change over time.
// For example: where the pointer is, how fast it's moving, or whether a drone is on.
const state = {
  kiki: {
    shape: null,
    playing: false, //no music
    size: settings.initialSize, //initial size
    stroke: settings.initialStroke, //initrial stroke
    frequency: settings.initialKikiFrequency, //initial requency
    x: 0, //position axis x
    y: 0, //position axis y
    interval: settings.kikiInterval, //interval between sounds for kiki
    elapsed: 0, //time between sounds, has to start with 0
    lastSize: null
  },

  bouba: {
    shape: null,
    playing: false,
    size: settings.initialSize,
    stroke: settings.initialStroke,
    frequency: settings.initialBoubaFrequency,
    x: 0,
    y: 0,
    interval: settings.boubaInterval,
    elapsed: 0,
    lastSize: null
  },

  pointer: {
    activeInstrument: null,
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0
  }
};

// ---------- Sound ----------
// Make the instruments and plug them into the speakers.
const sound = {
  kiki: null,
  bouba: null
};

function createSounds() {
  sound.kiki = new Tone.Synth({
    oscillator: {
      type: "square"
    },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.1
    }
  }).toDestination();

  sound.bouba = new Tone.Synth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.1
    }
  }).toDestination();
}

function updateVolume(name) {
  const instrument = state[name];

  const proportion =
    (instrument.size - settings.minSize) /
    (settings.maxSize - settings.minSize);

  const volume = -35 + proportion * 35;

  sound[name].volume.value = Math.max(-35, Math.min(0, volume));
}

function stopSound(name) {
  state[name].playing = false;
  state[name].elapsed = 0;

  sound[name].triggerRelease();
}

async function toggleSound(name) {
  await Tone.start();

  if (state[name].playing) {
    stopSound(name);
  } else {
    state[name].playing = true;
    state[name].elapsed = 0;
  }
}

// ---------- Update ----------
// Update the state. This is called every 100ms.
function updateAppearance(name) {
    const instrument = state[name];
    const element = instrument.shape.element;

    //stroke
    element.style.border = `${instrument.stroke}px solid #252525`;

    //coloured when active
    element.style.backgroundColor = instrument.playing
        ? "pink"
        : "transparent";
}

function update() {
for (const name of ["kiki", "bouba"]) {
    const instrument = state[name];

    instrument.size = Math.max(
      settings.minSize,
      Math.min(settings.maxSize, instrument.size)
    );

    instrument.frequency = Math.max(
      settings.minFrequency,
      Math.min(settings.maxFrequency, instrument.frequency)
    );
  }

  setTimeout(update, settings.updateInterval);
}

// ---------- Use ----------
// Use the state to make sound and move shapes. This is called every 100ms.
function use() {
for (const name of ["kiki", "bouba"]) {
    const instrument = state[name];
    const synth = sound[name];

    // state
    instrument.shape
      .setSize(instrument.size)
      .setPositionPixels(instrument.x, instrument.y)
      updateAppearance(name);

    //volume
    if (instrument.lastSize !== instrument.size) {
      updateVolume(name);
      instrument.lastSize = instrument.size;
    }

    //notes + rhythm
    if (instrument.playing) {
      instrument.elapsed += settings.updateInterval;

      if (instrument.elapsed >= instrument.interval) {
        synth.triggerAttackRelease(
          instrument.frequency,
          "8n"
        );

        instrument.elapsed = 0;
      }
    }
  }

  setTimeout(use, settings.updateInterval);
}

// ---------- Controls (Event Handlers) ----------
//uns every time the pointer goes down: a click, a tap or a pen touch.
function getInstrumentName(target) {
  if (!(target instanceof Element)) return null;

  if (target.closest("#kiki")) return "kiki";
  if (target.closest("#bouba")) return "bouba";

  return null;
}

function pointerDown(event) {
  const name = getInstrumentName(event.target);

  if (!name) return;

  event.preventDefault();

  const pointer = state.pointer;

  pointer.activeInstrument = name;
  pointer.dragging = false;

  pointer.startX = event.clientX;
  pointer.startY = event.clientY;
  pointer.lastX = event.clientX;
  pointer.lastY = event.clientY;
}

function pointerMove(event) {
    const pointer = state.pointer;

    if (!pointer.activeInstrument) return;

    const instrument = state[pointer.activeInstrument];

    const dx = event.clientX - pointer.lastX;
    const dy = event.clientY - pointer.lastY;

    if (
        Math.abs(event.clientX - pointer.startX) > 4 ||
        Math.abs(event.clientY - pointer.startY) > 4
    ) {
        pointer.dragging = true;
    }

    if (!pointer.dragging) return;

    //vertical changes pitch
    instrument.frequency -= dy;

    //horizontal changes stroke thickness
    instrument.stroke += dx * 0.25;

    instrument.stroke = Math.max(
        settings.minStroke,
        Math.min(settings.maxStroke, instrument.stroke)
    );

    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
}

function pointerUp() {
  const pointer = state.pointer;
  const name = pointer.activeInstrument;

  if (name && !pointer.dragging) {
    toggleSound(name);
  }

  pointer.activeInstrument = null;
  pointer.dragging = false;
}

function wheel(event) {
  const name = getInstrumentName(event.target);

  if (!name) return;

  event.preventDefault();

  const instrument = state[name];

  const sensitivity = 0.5;

  instrument.size -= event.deltaY * sensitivity;

  instrument.size = Math.max(
    settings.minSize,
    Math.min(settings.maxSize, instrument.size)
  );
}

function resetInstrument(name) {
  stopSound(name);

  const instrument = state[name];

  instrument.size = settings.initialSize;
  instrument.frequency =
    name === "kiki"
      ? settings.initialKikiFrequency
      : settings.initialBoubaFrequency;

  instrument.lastSize = null;
}

// ---------- Setup ----------
// Setup is run once, at the start of the program. It sets everything up for us!
function setup() {
  //kiki
  state.kiki.shape = createShape("kiki", "shape kiki");
  state.kiki.shape
    .setSize(settings.initialSize)
    .setColour(0, 0, 16)
    .setRoundedness(0);

  //bouba
  state.bouba.shape = createShape("bouba", "shape bouba");
  state.bouba.shape
    .setSize(settings.initialSize)
    .setColour(0, 0, 16)
    .setRoundedness(1);

  //shapes next to each other
  function positionShapes() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const size = settings.initialSize;

    state.kiki.x = width * 0.25 - size / 2;
    state.kiki.y = height * 0.45 - size / 2;

    state.bouba.x = width * 0.75 - size / 2;
    state.bouba.y = height * 0.45 - size / 2;
  }

  positionShapes();

  window.addEventListener("resize", positionShapes);

  createSounds();

  document.addEventListener("pointerdown", pointerDown);
  document.addEventListener("pointermove", pointerMove);
  document.addEventListener("pointerup", pointerUp);
  document.addEventListener("pointercancel", pointerUp);
  document.addEventListener("wheel", wheel, {
    passive: false
  });

  update();
  use();
}
setup(); // Always remember to call setup()!
