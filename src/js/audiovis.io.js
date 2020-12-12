// node_modules imports
import React, { useState, useRef, useEffect } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useHistory
} from "react-router-dom";
// Local imports: Routes
import { WEBGL } from "./utils/webgl.js";
// Local imports
import Layout from "./Layout.js";
import Flow from "./routes/Flow.js";
import Start from "./routes/Start.js";
import Finish from "./routes/Finish.js";
// Style imports
import "../sass/AudiovisIO.sass";

class AudiovisIO extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mapping: undefined
    };
    if (process.env.NODE_ENV === "production") {
      this.initServiceWorker();
    }
  }

  initServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(registration => {
            console.log("Serviceworker registered: ", registration);
          })
          .catch(registrationError => {
            console.log(
              "Serviceworker registration failed: ",
              registrationError
            );
          });
      });
    }
  }

  render() {
    return (
      <div className="audiovisio-wrapper">
        <Finish mapping={this.state.mapping} />
      </div>
    );
  }
}

export default AudiovisIO;
