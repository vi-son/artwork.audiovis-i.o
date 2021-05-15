import React from "react";
import { useValues, useActions } from "kea";
import totemLogic from "../artwork/logic.totem.js";
// Style
import "./SampleUserInterface.sass";

const SampleUserInterface = () => {
  const { volumes, sounds } = useValues(totemLogic);
  const { updateVolume } = useActions(totemLogic);

  return (
    <div className="sample-user-interface">
      {volumes.map((volume, i) => {
        return (
          <div
            className="sample"
            key={i}
            onClick={() => {
              const newVolume = volume >= 0.5 ? 0.0 : 1.0;
              sounds[i].setVolume(newVolume);
              updateVolume(i, newVolume);
            }}
          >
            <span className="sample-name">{sounds[i].name.split("/")[0]}</span>
            <span className={`sound ${volume >= 0.5 ? "on" : "off"}`}>
              <span className="icon">{volume <= 0.5 ? "🔇" : "🔊"}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SampleUserInterface;
