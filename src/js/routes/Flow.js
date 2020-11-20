// node_modules imports
import React, { useRef, useState, useEffect } from "react";
import { Link, withRouter } from "react-router-dom";
// Local imports
import Layout from "../Layout.js";
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
      "05-synthesizer/montez-sample-19-lead-synth-02.mp3"
    ]);

    groupSamples.set("guitar", [
      "03-guitar/montez-sample-02-main-git.mp3",
      "03-guitar/montez-sample-17-arp-git.mp3",
      "03-guitar/montez-sample-22-wah-git.mp3",
      "03-guitar/montez-sample-23-chords-git.mp3",
      "03-guitar/montez-sample-25-somh-git.mp3"
    ]);

    groupSamples.set("chords", [
      "02-chords/montez-sample-03-pad-01.mp3",
      "02-chords/montez-sample-04-pad-02.mp3",
      "02-chords/montez-sample-05-pad-03.mp3",
      "02-chords/montez-sample-14-keys-01.mp3",
      "02-chords/montez-sample-16-keys-02.mp3",
      "02-chords/montez-sample-21-keys-03.mp3"
    ]);

    groupSamples.set("bass", [
      "01-bass/montez-sample-06-synth-bass-02.mp3",
      "01-bass/montez-sample-07-synth-bass-01.mp3",
      "01-bass/montez-sample-18-e-bass-01.mp3",
      "01-bass/montez-sample-20-e-bass-02.mp3"
    ]);

    groupSamples.set("rhythm", [
      "04-rhythm/montez-sample-08-e-perc-01.mp3",
      "04-rhythm/montez-sample-09-e-perc-02.mp3",
      "04-rhythm/montez-sample-10-e-drums-01.mp3",
      "04-rhythm/montez-sample-11-shaker.mp3",
      "04-rhythm/montez-sample-12-toms.mp3",
      "04-rhythm/montez-sample-13-hh.mp3",
      "04-rhythm/montez-sample-24-e-perc-03.mp3"
    ]);

    this.groups = ["synthesizer", "guitar", "chords", "bass", "rhythm"];

    this.state = {
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
        mapping: undefined
      },
      mappings: []
    };

    this.prepareNextScenario = this.prepareNextScenario.bind(this);
    this.moveToNextScenario = this.moveToNextScenario.bind(this);
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
        mapping: undefined
      }),
      unmappedGroups: this.state.unmappedGroups.filter(
        e => e !== selectedGroup
      ),
      initialized: true
    });
    if (this.selectBoxRef.current) this.selectBoxRef.current.init();
  }

  moveToNextScenario() {
    this.setState({
      mappings: [...this.state.mappings, ...[this.state.currentMapping]],
      completedCount: this.state.completedCount + 1
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
        <hr />
        <h5>Scenario count: {this.state.scenarioCount}</h5>
        <span>
          {this.state.currentMapping.sample} ({this.state.currentMapping.group})
        </span>
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
      <main className="flow">
        <div className="left">
          <div className="description">
            <h3>
              <span className="emoji">🔊</span> 1. Audio
            </h3>
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
          <div className="empty"></div>
        </div>
        <div className="right">
          <SelectBox
            ref={this.selectBoxRef}
            options={["Gefühl", "Farbe", "Form"]}
            icons={[<IconFeeling />, <IconColor />, <IconShape />]}
            onIndexChange={(i, name) => {
              this.setState({
                isColorReactive: i === 1,
                currentMapping: Object.assign({}, this.state.currentMapping, {
                  type: name
                })
              });
            }}
          >
            <FeelingsInput
              onSelect={(feeling, point) => {
                this.setState({
                  backgroundColor: "var(--color-snow)",
                  currentMapping: Object.assign({}, this.state.currentMapping, {
                    mapping: { feeling: feeling, point: point }
                  })
                });
              }}
            />
            <ColorInput
              onChange={(s, r, g, b) => {
                this.setState({ backgroundColor: s });
              }}
              onSelect={(r, g, b) => {
                this.setState({
                  currentMapping: Object.assign({}, this.state.currentMapping, {
                    mapping: [r, g, b]
                  })
                });
              }}
            />
            <ShapeInput
              onSelect={shape => {
                this.setState({
                  backgroundColor: "var(--color-snow)",
                  currentMapping: Object.assign({}, this.state.currentMapping, {
                    mapping: shape
                  })
                });
              }}
            />
          </SelectBox>
        </div>

        {this.state.currentMapping.type !== undefined &&
        this.state.currentMapping.mapping !== undefined ? (
          <div className="button-wrapper">
            <div className="description">
              <h3>
                <span className="emoji">👉</span> 3. Weiter
              </h3>
              <article>Zum nächsten Schritt</article>
            </div>
            <button
              className="next-sample"
              onClick={() => {
                this.audioPlayerRef.current.stopAudio();
              }}
            >
              {this.state.completedCount === this.state.scenarioCount
                ? "Finish"
                : "Weiter"}
            </button>
          </div>
        ) : (
          <></>
        )}
      </main>
    );

    return (
      <div
        className="flow"
        style={{
          backgroundColor: this.state.isColorReactive
            ? this.state.backgroundColor
            : `var(--color-snow)`
        }}
      >
        {this.state.completedCount !== this.state.scenarioCount ? (
          workflowLayout
        ) : (
          <></>
        )}
        <Link to="/result">Weiter</Link>
        {process.env.NODE_ENV === "debug" ? mappingDebug : <></>}
        <Progressbar
          percent={(this.state.completedCount / this.state.scenarioCount) * 100}
          completedCount={this.state.completedCount}
          scenarioCount={this.state.scenarioCount}
        />
      </div>
    );
  }
}

export default withRouter(Flow);
