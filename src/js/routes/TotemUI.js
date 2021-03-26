// node_modules imports
import React, { useState, useRef, useEffect } from "react";
import { useValues, useActions } from "kea";
import { Kontrol } from "@vi.son/components";
import { utils } from "@vi.son/components";
// Logic imports
import totemLogic, { TOTEM_STATES } from "../artwork/logic.totem.js";
import Totem from "../artwork/Totem.js";
// Style imports
import "../../sass/components/Totem.sass";
// SVG imports
import IconMouse from "../../../assets/svg/mouse.svg";

const SoundUI = ({ volume }) => {
  return (
    <span>
      <span className="emoj">{volume > 0.0 ? "🔉" : "🔇"}</span>
      {volume}
    </span>
  );
};

const TotemUI = ({ mapping, onResize, paused, state, onSelect }) => {
  const canvasRef = useRef();
  const canvasWrapperRef = useRef();

  const { setCanvas, initTotem } = useActions(totemLogic);
  const { totem, volumes } = useValues(totemLogic);

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
      action: () => utils.requestFullscreen(canvasRef.current),
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

  useEffect(() => {
    const unmountTotemLogic = totemLogic.mount();
    if (canvasRef.current) {
      setCanvas(canvasRef.current);
      const totem = new Totem(canvasRef.current, onSelect);
      initTotem(totem);
    }
    return () => {
      totem.dispose();
      unmountTotemLogic();
    };
  }, []);

  return (
    <div className="totem">
      <div className="canvas-wrapper" ref={canvasWrapperRef}>
        <canvas className="canvas" ref={canvasRef}></canvas>
      </div>

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

      <Kontrol config={kontrolConfig} />

      <div className="samples">
        {volumes.map((v, i) => {
          return <SoundUI key={i} volume={v} />;
        })}
      </div>
    </div>
  );
};

export default TotemUI;
