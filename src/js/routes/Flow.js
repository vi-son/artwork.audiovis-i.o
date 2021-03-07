// node_modules imports
import React, { useRef, useState, useEffect } from "react";
import { Link, withRouter, useHistory } from "react-router-dom";
// Local imports
import AudioPlayer from "../components/AudioPlayer.js";
import SelectBox from "../components/SelectBox.js";
import ColorInput from "../components/ColorInput.js";
import FeelingsInput from "../components/FeelingsInput.js";
import ShapeInput from "../components/ShapeInput.js";
import Progressbar from "../components/Progressbar.js";
// SVG imports
import IconColor from "../../../assets/svg/audiovisio/color.svg";
import IconFeeling from "../../../assets/svg/audiovisio/feeling.svg";
import IconShape from "../../../assets/svg/audiovisio/shape.svg";
// Style imports
import "../../sass/routes/Flow.sass";

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Flow extends React.Component {
  constructor(props) {
    super(props);
    this.fadeDuration = 100;

    this.audioPlayerRef = React.createRef();
    this.selectBoxRef = React.createRef();

    const groupSamples = new Map();
    groupSamples.set("synthesizer", [
      "05-synthesizer/montez-sample-01-lead-synth.mp3",
      "05-synthesizer/montez-sample-19-lead-synth-02.mp3",
    ]);

    groupSamples.set("guitar", [
      "03-guitar/montez-sample-02-main-git.mp3",
      "03-guitar/montez-sample-17-arp-git.mp3",
      "03-guitar/montez-sample-22-wah-git.mp3",
      "03-guitar/montez-sample-23-chords-git.mp3",
      "03-guitar/montez-sample-25-somh-git.mp3",
    ]);

    groupSamples.set("chords", [
      "02-chords/montez-sample-03-pad-01.mp3",
      "02-chords/montez-sample-04-pad-02.mp3",
      "02-chords/montez-sample-05-pad-03.mp3",
      "02-chords/montez-sample-14-keys-01.mp3",
      "02-chords/montez-sample-16-keys-02.mp3",
      "02-chords/montez-sample-21-keys-03.mp3",
    ]);

    groupSamples.set("bass", [
      "01-bass/montez-sample-06-synth-bass-02.mp3",
      "01-bass/montez-sample-07-synth-bass-01.mp3",
      "01-bass/montez-sample-18-e-bass-01.mp3",
      "01-bass/montez-sample-20-e-bass-02.mp3",
    ]);

    groupSamples.set("rhythm", [
      "04-rhythm/montez-sample-08-e-perc-01.mp3",
      "04-rhythm/montez-sample-09-e-perc-02.mp3",
      "04-rhythm/montez-sample-10-e-drums-01.mp3",
      "04-rhythm/montez-sample-11-shaker.mp3",
      "04-rhythm/montez-sample-12-toms.mp3",
      "04-rhythm/montez-sample-13-hh.mp3",
      "04-rhythm/montez-sample-24-e-perc-03.mp3",
    ]);

    this.groups = ["synthesizer", "guitar", "chords", "bass", "rhythm"];

    this.state = {
      selectedIdx: -1,
      initialized: false,
      groups: this.groups,
      scenarioCount: 5,
      completedCount: 0,
      isColorReactive: false,
      backgroundColor: "var(--color-snow)",
      groupSamples: groupSamples,
      unmappedGroups: Array.from(this.groups.values()),
      currentMapping: {
        sample: undefined,
        group: undefined,
        type: undefined,
        mapping: undefined,
      },
      mappings: [],
    };

    this.prepareNextScenario = this.prepareNextScenario.bind(this);
    this.moveToNextScenario = this.moveToNextScenario.bind(this);
  }

  componentWillReceiveProps({ selection }) {
    const newMapping = Object.assign({}, this.state.currentMapping, selection);
    this.setState({
      currentMapping: newMapping,
    });
  }

  prepareNextScenario() {
    if (this.state.completedCount === this.state.scenarioCount) {
      this.props.onFinish(this.state.mappings, this.props.history);
      return;
    }
    this.setState({ backgroundColor: "var(--color-snow)" });
    const randomGroupIdx =
      this.state.unmappedGroups.length > 1
        ? getRandomInt(0, this.state.unmappedGroups.length - 1)
        : 0;
    const selectedGroup = this.state.unmappedGroups[randomGroupIdx];
    const availableSamples = this.state.groupSamples.get(selectedGroup);
    const randomSampleIdx = getRandomInt(0, availableSamples.length - 1);
    const selectedSample = availableSamples[randomSampleIdx];
    this.setState({
      currentMapping: Object.assign({}, this.state.currentMapping, {
        sample: selectedSample,
        group: selectedGroup,
        type: undefined,
        mapping: undefined,
      }),
      unmappedGroups: this.state.unmappedGroups.filter(
        (e) => e !== selectedGroup
      ),
      initialized: true,
    });
    if (this.selectBoxRef.current) this.selectBoxRef.current.init();
  }

  moveToNextScenario() {
    this.setState({
      mappings: [...this.state.mappings, ...[this.state.currentMapping]],
      completedCount: this.state.completedCount + 1,
    });
    this.prepareNextScenario();
  }

  componentDidMount() {
    this.prepareNextScenario();
  }

  render() {
    if (!this.state.initialized) {
      return <></>;
    }
    const mappingDebug = (
      <div className="mapping-debug">
        <span>{this.state.completedCount}</span>
        <h5>Scenario count: {this.state.scenarioCount}</h5>
        <br />
        <hr />
        {this.state.currentMapping ? (
          <div className="current-mapping">
            <span>
              <b>Type: </b>
              {this.state.currentMapping.type}
            </span>
            <span>
              <b>Sample: </b> {this.state.currentMapping.sample}
            </span>
            <span>
              <b>Group: </b>
              {this.state.currentMapping.group}
            </span>
            <span>{JSON.stringify(this.state.currentMapping.mapping)}</span>
          </div>
        ) : (
          <></>
        )}
        <hr />
        <ol>
          {this.state.unmappedGroups.map((umg, i) => {
            return <li key={i}>{umg}</li>;
          })}
        </ol>
        <hr />
        {this.state.mappings.map((m, i) => {
          return (
            <small className="mapping" key={i}>
              <span>
                <b>sample: </b>
                {m.sample} ({m.group})
              </span>
              <span>
                <b>type: </b>
                {m.type}
              </span>
              <span>
                <b>mapping: </b>
                {JSON.stringify(m.mapping)}
              </span>
            </small>
          );
        })}
      </div>
    );

    const workflowLayout = (
      <>
        <div className="description step-1">
          <span className="emoji">🔊</span>
          <h3 className="title">1. Audio</h3>
          <article>Spiel das Audiosample ab</article>
        </div>

        <AudioPlayer
          ref={this.audioPlayerRef}
          fadeDuration={this.fadeDuration}
          audiosrc={`/assets/audio/audiovisio/${this.state.currentMapping.sample}`}
          onStopped={() => {
            this.moveToNextScenario();
          }}
        />

        {/* {this.state.currentMapping.type !== undefined && */}
        {/* this.state.currentMapping.mapping !== undefined ? ( */}
        <div className="button-wrapper">
          <div
            className="description step-3"
            onClick={() => {
              this.audioPlayerRef.current.stopAudio();
              this.props.onClear();
              this.props.history.push("/flow");
            }}
          >
            <span className="emoji">👉</span>
            <h3 className="title">3. Weiter</h3>
            <article>Zum nächsten Schritt</article>
          </div>
        </div>

        {/* ) : ( */}
        {/*   <></> */}
        {/* )} */}

        <div className="mapping-selection">
          <Link
            to="/flow?state=color-input"
            className="input-selection"
            onClick={this.props.onClear}
          >
            <IconColor />
            <span>Farbe</span>
          </Link>
          <Link
            to="/flow?state=feeling-input"
            className="input-selection"
            onClick={this.props.onClear}
          >
            <IconFeeling />
            <span>Gefühl</span>
            <h4>{JSON.stringify(this.props.selection)}</h4>
          </Link>
          <Link
            to="/flow?state=shape-input"
            className="input-selection"
            onClick={this.props.onClear}
          >
            <IconShape />
            <span>Form</span>
          </Link>
        </div>
      </>
    );

    return (
      <main className="flow">
        {this.state.completedCount !== this.state.scenarioCount ? (
          workflowLayout
        ) : (
          <></>
        )}

        {process.env.NODE_ENV === "development" ? mappingDebug : <></>}

        <Progressbar
          percent={(this.state.completedCount / this.state.scenarioCount) * 100}
          completedCount={this.state.completedCount}
          scenarioCount={this.state.scenarioCount}
        />
      </main>
    );
  }
}

export default withRouter(Flow);
