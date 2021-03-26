// node_modules imports
import React, { useEffect } from "react";
import { useActions } from "kea";
// Local imports
import totemLogic, { TOTEM_STATES } from "../artwork/logic.totem.js";

const TotemRoute = () => {
  const { setState } = useActions(totemLogic);

  useEffect(() => {
    setState(TOTEM_STATES.TOTEM);
  }, []);

  return <div></div>;
};

export default TotemRoute;
