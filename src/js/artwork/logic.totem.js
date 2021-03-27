import { kea } from "kea";
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

    setVolumes: (volumes) => ({ volumes }),

    mapCurrentSampleTo: (type, mapping) => ({ type, mapping }),
    setCurrentSample: (group, sample) => ({ group, sample }),
    clearCurrentMapping: () => true,

    storeMapping: (mapping) => ({ mapping }),
    clearMappings: () => true,
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
      {},
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
          samples.map((s) => s.pause());
          return samples.splice(0, samples.length);
        },
      },
    ],

    volumes: [[], { setVolumes: (_, { volumes }) => volumes }],
  },

  listeners: ({ actions, values }) => ({
    setState: () => {
      console.log("STATE CHANGE", values.state);
      if (values.totem) {
        values.totem.reactOnStateChange();
      }
    },

    addSample: ({ sample }) => {
      console.log(sample);
      console.log(values.sounds);
      if (values.sounds.length >= 5) {
        values.sounds.forEach((s) => s.play());
      }
    },

    updateSamples: ({}) => {
      actions.setVolumes(values.sounds.map((s) => s.getVolume()));
    },

    clearCurrentMapping: ({}) => {
      actions.setState(TOTEM_STATES.FLOW);
    },
  }),
});

export default totemLogic;
export { TOTEM_STATES, MAPPINGS };
