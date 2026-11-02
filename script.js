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
    frequency: settings.initialKikiFrequency, //initial frequency
    x: 0, //position axis x
    y: 0, //position axis y
    interval: settings.kikiInterval, //interval between sounds for kiki
    elapsed: 0, //time between sounds, has to start with 0
    lastSize: null
  },

  bouba: {
    shape: null,
    playing: false, //no music
    size: settings.initialSize, //initial size
    stroke: settings.initialStroke, //initial stroke
    frequency: settings.initialBoubaFrequency, //initial frequency
    x: 0, //position axis x
    y: 0, //position axis y
    interval: settings.boubaInterval, //interval between sounds for bouba
    elapsed: 0, //time between sounds, has to start with 0
    lastSize: null
  },

  pointer: {
    activeInstrument: null, //no music
    dragging: false, //tells if its moving or clicking
    startX: 0, //start position
    startY: 0,
    lastX: 0, //end position
    lastY: 0
  }
};

// ---------- Sound ----------
// Make the instruments and plug them into the speakers.
const sound = {
  kiki: null, //no sound
  bouba: null //no sound
};

function createSounds() {
  sound.kiki = new Tone.Synth({
    oscillator: {
      type: "square" //soound type
    },
    envelope: {
      attack: 0.01, //starts
      decay: 0.1, //decreases after attack
      sustain: 0.3, //volume level while the note is held
      release: 0.1 //fadeout
    }
  }).toDestination(); //going to the speakers

  sound.bouba = new Tone.Synth({
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 0.01, //starts
      decay: 0.1, //decreases after attack
      sustain: 0.3, //volume level while the note is held
      release: 0.1 //fadeout
    }
  }).toDestination(); //going to the speakers
}

function updateVolume(name) {
  const instrument = state[name];

  //converts the shape size into a value between 0 and 1
  const proportion =
    (instrument.size - settings.minSize) /
    (settings.maxSize - settings.minSize);

  //maps the size to a volume range from -35 dB to 0 dB
  const volume = -35 + proportion * 35;

  //keeps the volume within range
  sound[name].volume.value = Math.max(-35, Math.min(0, volume));
}

function stopSound(name) {
  state[name].playing = false; //marks the instrument as stopped
  state[name].elapsed = 0; //resets the sound timing

  sound[name].triggerRelease(); //fades out the current note
}

async function toggleSound(name) {
  await Tone.start(); //starts the audio after interaction

  //switches between playing and stopped
  if (state[name].playing) {
    stopSound(name);
  } else {
    state[name].playing = true;
    state[name].elapsed = 0; //resets timing when music starts
  }
}

// ---------- Update ----------
// Update the state. This is called every 100ms.
function updateAppearance(name) {
    const instrument = state[name];
    const element = instrument.shape.element;

    //stroke, $ template literals for variables
    element.style.border = `${instrument.stroke}px solid #252525`;

    //coloured when active
    element.style.backgroundColor = instrument.playing
        ? "pink"
        : "transparent";
}

function update() {
for (const name of ["kiki", "bouba"]) {
    const instrument = state[name];

    //keeps it within the min and max
    instrument.size = Math.max(
      settings.minSize,
      Math.min(settings.maxSize, instrument.size)
    );

    //keeps it within the min and max
    instrument.frequency = Math.max(
      settings.minFrequency,
      Math.min(settings.maxFrequency, instrument.frequency)
    );
  }
  //runs the update function again after the specified interval
  setTimeout(update, settings.updateInterval);
}

// ---------- Use ----------
// Use the state to make sound and move shapes. This is called every 100ms.
function use() {
  //updates shapes
for (const name of ["kiki", "bouba"]) {
    const instrument = state[name];
    const synth = sound[name];

    //applies the current size and position to the shape
    instrument.shape
      .setSize(instrument.size)
      .setPositionPixels(instrument.x, instrument.y)
      updateAppearance(name);

    //updates volume only when the shape size changes, !==
    if (instrument.lastSize !== instrument.size) {
      updateVolume(name);
      instrument.lastSize = instrument.size;
    }

    //notes + rhythm
    if (instrument.playing) {
      //tracks elapsed time meanwhile
      instrument.elapsed += settings.updateInterval;

      //plays a new note when the instrument's interval is reached
      if (instrument.elapsed >= instrument.interval) {
        synth.triggerAttackRelease(
          instrument.frequency,
          "8n"
        );

        //resets the timer for the next note
        instrument.elapsed = 0;
      }
    }
  }
  //repeats the function after the interval
  setTimeout(use, settings.updateInterval);
}

// ---------- Controls (Event Handlers) ----------
//runs every time the pointer does
//checks if the event target is a valid HTML element
function getInstrumentName(target) {
  if (!(target instanceof Element)) return null;

  //if happened on kiki or bouba
  if (target.closest("#kiki")) return "kiki";
  if (target.closest("#bouba")) return "bouba";

//nothing if neither
  return null;
}

//identifies which instrument the pointer interacts with
function pointerDown(event) {
  const name = getInstrumentName(event.target);

  //stops the function if the pointer is outside of both
  if (!name) return;

  //prevents the browser's default pointer behaviour
  event.preventDefault();

  const pointer = state.pointer;

  //which instrument is currently being interacted with
  pointer.activeInstrument = name;

  //assumption of clicking
  pointer.dragging = false;

  //start position
  pointer.startX = event.clientX;
  pointer.startY = event.clientY;

  //current position for movement calculations
  pointer.lastX = event.clientX;
  pointer.lastY = event.clientY;
}

function pointerMove(event) {
    const pointer = state.pointer;

    //checks whether an instrument is currently being interacted with
    if (!pointer.activeInstrument) return;

    const instrument = state[pointer.activeInstrument];

    //calculates pointer movement since the previous event
    const dx = event.clientX - pointer.lastX;
    const dy = event.clientY - pointer.lastY;


    //detects dragging when the pointer moves more than 4 pixels
    if (
        Math.abs(event.clientX - pointer.startX) > 4 ||
        Math.abs(event.clientY - pointer.startY) > 4
    ) {
        pointer.dragging = true;
    }

    //stops here if the movement is too small to count as dragging
    if (!pointer.dragging) return;

    //vertical changes pitch
    instrument.frequency -= dy;

    //horizontal changes stroke thickness
    instrument.stroke += dx * 0.25;

    //keeps stroke thickness within the allowed range
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

  //toggles the sound if the interaction was a click
  if (name && !pointer.dragging) {
    toggleSound(name);
  }

  //resets the pointer interaction state
  pointer.activeInstrument = null;
  pointer.dragging = false;
}

function wheel(event) {
  //identifies which shape the pointer is hovering over
  const name = getInstrumentName(event.target);

  //stops if the pointer is outside both
  if (!name) return;

  //prevents the page from scrolling while interacting with a shape
  event.preventDefault();

  const instrument = state[name];

  //controls how quickly the shape changes size
  const sensitivity = 0.5;

  //changes the shape size based on the scroll movement
  instrument.size -= event.deltaY * sensitivity;

  //keeps the shape size within the range
  instrument.size = Math.max(
    settings.minSize,
    Math.min(settings.maxSize, instrument.size)
  );
}

function resetInstrument(name) {
    //stops the sound before resetting the instrument
    stopSound(name);

  const instrument = state[name];

  //restores the original size
  instrument.size = settings.initialSize;
  instrument.frequency =
    name === "kiki"
      ? settings.initialKikiFrequency
      : settings.initialBoubaFrequency;

  //volume update after the size reset
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

    //positions in the left half of the screen
    state.kiki.x = width * 0.25 - size / 2;
    state.kiki.y = height * 0.45 - size / 2;

    //positions in the right half of the screen
    state.bouba.x = width * 0.75 - size / 2;
    state.bouba.y = height * 0.45 - size / 2;
  }

  //sets the initial positions for both
  positionShapes();

  //repositions the shapes when the browser window changes size
  window.addEventListener("resize", positionShapes);

   //creates the sound synthesizers
  createSounds();

  //registers pointer and scroll event listeners
  document.addEventListener("pointerdown", pointerDown);
  document.addEventListener("pointermove", pointerMove);
  document.addEventListener("pointerup", pointerUp);
  document.addEventListener("pointercancel", pointerUp);
  document.addEventListener("wheel", wheel, {
    passive: false
  });

  //starts the update and use loops
  update();
  use();
}
//runs the setup function when the program loads
setup(); // Always remember to call setup()!
