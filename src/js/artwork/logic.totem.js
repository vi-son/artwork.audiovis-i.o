import { kea } from "kea";
import { Vector3 } from "three";
// Local imports
import Totem from "./Totem.js";

const exampleMappings = require("../../json/08f406489239afeddc1391e4125cf37b.json");

const TOTEM_STATES = {
  INIT: 0,
  FLOW: 1,
  COLOR_MAPPING: 2,
  FEELING_MAPPING: 3,
  SHAPE_MAPPING: 4,
  TOTEM: 5,
};

const MAPPINGS = {
  COLOR: "color",
  FEELING: "feeling",
  SHAPE: "shape",
};

const totemLogic = kea({
  actions: {
    setCanvas: (canvas) => ({ canvas }),

    initTotem: (totem) => ({ totem }),

    setState: (state) => ({ state }),

    addSample: (sample) => ({ sample }),
    removeSample: (sample) => ({ sample }),
    updateSamples: (samples) => ({ samples }),
    clearSamples: () => true,

    addVolume: (volume) => ({ volume }),
    updateVolume: (index, volume) => ({ index, volume }),

    mapCurrentSampleTo: (type, mapping) => ({ type, mapping }),
    setCurrentSample: (group, sample) => ({ group, sample }),
    clearCurrentMapping: () => true,

    storeMapping: (mapping) => ({ mapping }),
    clearMappings: () => true,

    updateScreenPosition: (screenPosition) => ({ screenPosition }),
    setHint: (text) => ({ text }),
  },

  reducers: {
    state: [
      TOTEM_STATES.INIT,
      {
        setState: (_, { state }) => state,
      },
    ],

    canvas: [
      null,
      {
        setCanvas: (_, { canvas }) => canvas,
      },
    ],

    totem: [
      null,
      {
        initTotem: (_, { totem }) => totem,
      },
    ],

    hint: ["", { setHint: (_, { text }) => text }],

    volumes: [
      [],
      {
        addVolume: (state, { volume }) => [...state, volume],
        updateVolume: (state, { index, volume }) =>
          state.map((v, i) => (i === index ? volume : v)),
      },
    ],

    screenPosition: [
      new Vector3(),
      { updateScreenPosition: (v, { screenPosition }) => screenPosition },
    ],

    // @TODO add groups
    // add method to map by group
    currentMapping: [
      {
        sample: undefined,
        group: undefined,
        type: undefined,
        mapping: undefined,
      },
      {
        mapCurrentSampleTo: (state, { type, mapping }) => {
          return Object.assign({}, state, { type, mapping });
        },
        setCurrentSample: (state, { group, sample }) => {
          return Object.assign({}, state, {
            group,
            sample,
            type: undefined,
            mapping: undefined,
          });
        },
        clearCurrentMapping: (state) => {
          return Object.assign({}, state, {
            type: undefined,
            mapping: undefined,
          });
        },
      },
    ],

    mappings: [
      exampleMappings,
      {
        storeMapping: (mappings, { mapping }) => {
          const entry = {};
          entry[mapping.group] = mapping;
          const newMappings = Object.assign({}, mappings, entry);
          console.log(newMappings);
          return newMappings;
        },
        clearMappings: (mappings) => ({}),
      },
    ],

    sounds: [
      [],
      {
        addSample: (samples, { sample }) => [...samples, sample],
        removeSample: (samples, { sample }) => samples,
        updateSamples: (_, { samples }) => [...samples],
        clearSamples: (samples) => {
          return [];
        },
      },
    ],
  },

  listeners: ({ actions, values }) => ({
    setState: () => {
      console.log("State change", values.state);
      actions.setHint("");
      if (values.totem) {
        values.totem.reactOnStateChange();
      }
    },

    addSample: ({ sample }) => {
      if (values.sounds.length >= 5) {
        values.sounds.forEach((s) => {
          s.play();
        });
      }
    },

    clearCurrentMapping: ({}) => {
      actions.setState(TOTEM_STATES.FLOW);
    },
  }),
});

export default totemLogic;
export { TOTEM_STATES, MAPPINGS };
