// node_modules imports
import React, { useState, useRef, useEffect } from "react";
// Local imports
import Totem from "../artwork/Totem.js";
// Style imports
import "../../sass/components/Totem.sass";
// SVG imports
import IconMouse from "../../../assets/svg/mouse.svg";

const TotemUI = ({ mapping, onResize, paused, state, onSelect }) => {
  const canvasRef = useRef();
  const canvasWrapperRef = useRef();
  const [renderer, setRenderer] = useState(null);
  const [renderLoop, setRenderLoop] = useState(null);
  const [playingStates, setPlayingStates] = useState(mapping.map(() => true));
  const [totem, setTotem] = useState(null);

  useEffect(() => {
    if (paused && totem) {
      console.log("pause");
      totem.pause();
    }
    if (!paused && totem) {
      console.log("contiune");
      totem.continue();
    }
  }, [paused]);

  useEffect(() => {
    if (totem) {
      totem.setState(state);
    }
  }, [state]);

  useEffect(() => {
    if (totem) {
      totem.dispose();
      setTimeout(() => {
        totem.setMapping(mapping).then(() => {});
      }, 1000);
    }
  }, mapping);

  useEffect(() => {
    if (canvasRef.current) {
      const totem = new Totem(canvasRef.current, onSelect);
      if (state === "totem") {
        totem.setMapping(mapping);
        totem.setState(state);
      }
      const resizeHandler = window.addEventListener(
        "resize",
        totem.handleResize.bind(totem),
        false
      );
      const pointerUpHandler = window.addEventListener(
        "pointerup",
        totem.handlePointerUp.bind(totem),
        false
      );
      const pointerDownHandler = window.addEventListener(
        "pointerdown",
        totem.handlePointerDown.bind(totem),
        false
      );
      const pointerMoveHandler = window.addEventListener(
        "pointermove",
        totem.handlePointerMove.bind(totem),
        false
      );
      setTotem(totem);
    }

    return () => {
      totem.dispose();
    };
  }, []);

  return (
    <div className="totem">
      {totem !== null ? (
        <div
          className={["sounds-ui", state !== "totem" ? "hidden" : ""].join(" ")}
        >
          {mapping.map((s, i) => {
            return (
              <span
                key={i}
                className={[
                  "sound-ui",
                  playingStates[i] ? "active" : "inactive",
                ].join(" ")}
                onClick={() => {
                  totem.isPlaying(i) ? totem.pauseSound(i) : totem.playSound(i);
                  setPlayingStates(totem.playingStates);
                }}
              >
                <span className="sound">
                  <span className="emoji">
                    {playingStates[i] ? "🔊" : "🔇"}
                  </span>
                  <span className="group">{s.group}</span>
                </span>
              </span>
            );
          })}
        </div>
      ) : (
        <></>
      )}

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

      <div
        className={[
          "interaction-explanation",
          state !== "totem" ? "hidden" : "",
        ].join(" ")}
      >
        <IconMouse />
        <article className="text">
          Klick und ziehen zum Drehen Mausrad für Zoom
        </article>
      </div>
    </div>
  );
};

export default TotemUI;
