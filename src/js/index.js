import React from "react";
import ReactDOM from "react-dom";
// Local imports
import AudiovisIO from "./audiovis.io.js";
// Style imports
import "../sass/index.sass";

const mount = document.querySelector("#mount");
ReactDOM.render(<AudiovisIO />, mount);
