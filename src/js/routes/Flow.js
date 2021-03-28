// node_modules imports
import React, { useRef, useState, useEffect } from "react";
import { Link, withRouter, useHistory } from "react-router-dom";
import { useValues, useActions } from "kea";
import { utils } from "@vi.son/components";
const { mobileCheck } = utils;
// Local imports
import totemLogic from "../artwork/logic.totem.js";
import { TOTEM_STATES } from "../artwork/logic.totem.js";
import AudioPlayer, { playerLogic } from "../components/AudioPlayer.js";
import Progressbar from "../components/Progressbar.js";
// SVG imports
import IconColor from "../../../assets/svg/audiovisio/color.svg";
import IconFeeling from "../../../assets/svg/audiovisio/feeling.svg";
import IconShape from "../../../assets/svg/audiovisio/shape.svg";
// Utils
import { getRandomInt } from "../utils.js";
// Style imports
import "../../sass/routes/Flow.sass";

class Flow extends React.Component {
  constructor(props) {
    super(props);
    this.fadeDuration = 100;

    this._isMobile = mobileCheck();

    this.selectBoxRef = React.createRef();

    const groupSamples = new Map();
    Object.keys(process.env.SAMPLES).forEach((group) => {
      groupSamples.set(group, process.env.SAMPLES[group]);
    });
    const groups = Object.keys(process.env.SAMPLES);

    this.state = {
      showDebug: false,
      selectedIdx: -1,
      initialized: false,
      groups: groups,
      scenarioCount: 5,
      completedCount: 0,
      isColorReactive: false,
      backgroundColor: "var(--color-snow)",
      groupSamples: groupSamples,
      unmappedGroups: Array.from(groups.values()),
    };

    this.prepareNextScenario = this.prepareNextScenario.bind(this);
    this.moveToNextScenario = this.moveToNextScenario.bind(this);
  }

  prepareNextScenario() {
    if (this.state.completedCount + 1 === this.state.scenarioCount) {
      this.props.audio.pause();
      this.props.history.push("/totem");
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
      unmappedGroups: this.state.unmappedGroups.filter(
        (e) => e !== selectedGroup
      ),
      initialized: true,
    });
    this.actions.setCurrentSample(selectedGroup, selectedSample);
    if (this.selectBoxRef.current) this.selectBoxRef.current.init();
  }

  moveToNextScenario() {
    this.actions.storeMapping(this.props.currentMapping);
    this.setState({
      completedCount: this.state.completedCount + 1,
    });
    this.actions.clearCurrentMapping();
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
      <>
        <button
          className="toggle-debug"
          onClick={() => this.setState({ showDebug: !this.state.showDebug })}
        >
          debug
        </button>
        {this.state.showDebug ? (
          <div className="mapping-debug">
            <b className="label">Sound Count:</b>
            <span>{this.props.sounds.length}</span>
            <b className="label">Mappings:</b>
            <span>{this.state.scenarioCount}</span>
            <b className="label">Completed: </b>
            <span>{this.state.completedCount}</span>
            <br />
            <hr />
            {this.props.currentMapping ? (
              <>
                <b className="label">Type: </b>
                <span>{this.props.currentMapping.type}</span>
                <b className="label">Sample: </b>
                <span>{this.props.currentMapping.sample}</span>
                <b className="label">Group: </b>
                <span>{this.props.currentMapping.group}</span>
                <b className="label">Current Mapping: </b>
                <span>{JSON.stringify(this.props.currentMapping.mapping)}</span>
              </>
            ) : (
              <></>
            )}
            <hr />
            <b className="label">Groups: </b>
            <ol>
              {this.state.unmappedGroups.map((umg, i) => {
                return <li key={i}>{umg}</li>;
              })}
            </ol>
            <hr />
            {Object.keys(this.props.mappings).map((key, i) => {
              const m = this.props.mappings[key];
              return (
                <small className="mapping" key={i}>
                  <h3 className="group">{key}</h3>
                  <b className="sample">Sample (Group): </b>
                  <span>
                    {m.sample} ({m.group})
                  </span>
                  <b>type: </b>
                  <span>{m.type}</span>
                  <b className="label">Mapping: </b>
                  <span>{JSON.stringify(m.mapping)}</span>
                </small>
              );
            })}
          </div>
        ) : (
          <></>
        )}
      </>
    );

    const WorkflowLayout = () => {
      return (
        <>
          <div className="description step-1">
            <span className="emoji">🔊</span>
            <h3 className="title">1. Audio</h3>
            <span className="subtitle">Spiel das Sample ab</span>
          </div>

          <AudioPlayer
          /* onStopped={() => { */
          /*   this.moveToNextScenario(); */
          /* }} */
          />

          {this.props.currentMapping.type !== undefined &&
          this.props.currentMapping.mapping !== undefined ? (
            <div className="button-wrapper">
              <div className="description step-3">
                <button
                  className="btn-next emoji"
                  onClick={() => {
                    this.actions.clearCurrentMapping();
                  }}
                >
                  🔧
                </button>
                <div className="text back">
                  <h3 className="title">Zurück</h3>
                  <span>Mapping ändern</span>
                </div>
                <div className="text next">
                  <h3 className="title">Weiter</h3>
                  <span>nächster Schritt</span>
                </div>
                <button
                  className="btn-next emoji"
                  onClick={() => {
                    /* this.audioPlayerRef.current.stopAudio(); */
                    this.moveToNextScenario();
                  }}
                >
                  👉
                </button>
              </div>
            </div>
          ) : (
            <></>
          )}

          <div className="selection-annotation">
            {this.props.hint.length > 0 ? (
              <div
                className="annotation"
                style={{
                  transform: `translateX(${this.props.screenPosition.x}px) translateY(${this.props.screenPosition.y}px)`,
                  opacity: this.props.screenPosition.z,
                }}
              >
                {this.props.hint}
              </div>
            ) : (
              <></>
            )}
          </div>

          {this.props.currentMapping.type === undefined &&
          this.props.currentMapping.mapping === undefined ? (
            <div className="mapping-selection">
              <div
                className="input-selection"
                onClick={() => {
                  this.actions.setState(TOTEM_STATES.COLOR_MAPPING);
                }}
              >
                <IconColor />
                <span>Farbe</span>
              </div>
              <div
                className="input-selection"
                onClick={() => {
                  this.actions.setState(TOTEM_STATES.FEELING_MAPPING);
                }}
              >
                <IconFeeling />
                <span>Gefühl</span>
              </div>
              <div
                className="input-selection"
                onClick={() => {
                  this.actions.setState(TOTEM_STATES.SHAPE_MAPPING);
                }}
              >
                <IconShape />
                <span>Form</span>
              </div>
            </div>
          ) : (
            <></>
          )}
        </>
      );
    };

    return (
      <main className="flow">
        {this.state.completedCount !== this.state.scenarioCount ? (
          <WorkflowLayout />
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

export default withRouter(totemLogic(playerLogic(Flow)));
