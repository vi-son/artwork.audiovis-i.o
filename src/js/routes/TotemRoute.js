// node_modules imports
import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useValues, useActions } from "kea";
import { Kontrol } from "@vi.son/components";
import { utils } from "@vi.son/components";
import { ButtonEmoji } from "@vi.son/components";
// Local imports
import totemLogic, { TOTEM_STATES } from "../artwork/logic.totem.js";
// SVG imports
import IconMouse from "../../../assets/svg/mouse.svg";
// Style imports
import "../../sass/routes/TotemRoute.sass";

const SoundUI = ({ index, volume, sound, onChange }) => {
  return (
    <span onClick={() => onChange(index)}>
      <span className="emoj">{volume > 0.0 ? "🔉" : "🔇"}</span>
    </span>
  );
};

const TotemRoute = () => {
  const { setState, updateSamples } = useActions(totemLogic);
  const { totem, volumes, canvas, sounds } = useValues(totemLogic);
  const history = useHistory();

  useEffect(() => {
    setState(TOTEM_STATES.TOTEM);
  }, []);

  const kontrolConfig = {
    file: {
      icon: "📁",
      type: "file",
      label: "datei",
      action: () => {},
    },
    fullscreen: {
      icon: "🔎",
      hidden: utils.mobileCheck(),
      type: "button",
      label: "vollbild",
      action: () => utils.requestFullscreen(canvas),
    },
    screenshot: {
      icon: "📷",
      hidden: utils.mobileCheck(),
      type: "button",
      label: "schnappschuss",
      action: () => {
        totem.pause();
        setTimeout(() => {
          utils
            .downloadRendering(canvasRef.current)
            .then(() => totem.continue());
        }, 100);
      },
    },
    pause: {
      icon: "⌛️",
      type: "button",
      label: "pause",
      action: () => totem.pause(),
    },
    continue: {
      icon: "🚀",
      type: "button",
      label: "weiter",
      action: () => totem.continue(),
    },
    divider: { type: "divider" },
    sound1: {
      icon: "",
      type: "button",
      label: "sound",
      action: () => {},
    },
  };

  return (
    <div className="totem">
      {/* EXPERIMENTAL GLTF EXPORT */}
      {/* <button */}
      {/*   className="export" */}
      {/*   onClick={() => { */}
      {/*     totem.export(); */}
      {/*   }} */}
      {/* > */}
      {/*   Export */}
      {/* </button> */}

      {/* <div */}
      {/*   className={[ */}
      {/*     "interaction-explanation", */}
      {/*     state !== "totem" ? "hidden" : "", */}
      {/*   ].join(" ")} */}
      {/* > */}
      {/*   <IconMouse /> */}
      {/*   <article className="text"> */}
      {/*     Klick und ziehen zum Drehen Mausrad für Zoom */}
      {/*   </article> */}
      {/* </div> */}
      <div>
        <Kontrol config={kontrolConfig}>
          <div className="samples">
            {sounds.map((v, i) => {
              return <SoundUI key={i} index={i} volume={0.0} />;
            })}
          </div>
        </Kontrol>
      </div>
      <ButtonEmoji
        className="btn-to-start"
        emoji={"🔄"}
        text="nochmal"
        onClick={() => {
          totem.dispose();
          history.push("/flow");
        }}
      />
    </div>
  );
};

export default TotemRoute;
