// node_modules imports
import React, { useState, useRef, useEffect } from "react";
import { useValues, useActions } from "kea";
// Logic imports
import totemLogic, { TOTEM_STATES } from "../artwork/logic.totem.js";
import Totem from "../artwork/Totem.js";
// Style imports
import "../../sass/components/ArtworkContainer.sass";

const ArtworkContainer = ({ mapping, onResize, paused, state, onSelect }) => {
  const canvasRef = useRef();
  const canvasWrapperRef = useRef();

  const { setCanvas, initTotem } = useActions(totemLogic);
  const { totem } = useValues(totemLogic);

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
    <div className="artwork">
      <div className="canvas-wrapper" ref={canvasWrapperRef}>
        <canvas className="canvas" ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default ArtworkContainer;
