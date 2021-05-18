import { Audio, AudioAnalyser } from "three";

class Sample {
  constructor(audioListener, name) {
    this._name = name;
    console.log("New Sampl: ", this._name);
    this._audio = new Audio(audioListener);
    this._analyzer = new AudioAnalyser(this._audio, 32);
    this._analyzer.smoothingTimeConstant = 0.9;
  }

  setup(buffer) {
    this._audio.setBuffer(buffer);
    this._audio.setLoop(true);
    this._audio.setVolume(1.0);
  }

  play() {
    this._audio.play();
  }

  get audio() {
    return this._audio;
  }

  get name() {
    return this._name;
  }

  get analyzer() {
    return this._analyzer;
  }

  dispose() {
    this._audio = null;
    this._analyzer = null;
  }
}

export default Sample;
