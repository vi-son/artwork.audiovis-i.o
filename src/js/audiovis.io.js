// node_modules imports
import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
// Local imports: Routes
import { WEBGL } from "@utils/webgl.js";
import Flow from "@routes/Flow.js";
import Start from "@routes/Start.js";
import Finish from "@routes/Finish.js";
// Style imports
import "@sass/audiovis.io.sass";

const Harvester = () => {
  const [mappingJson, setMappingJson] = useState(undefined);

  // const exampleMapping = JSON.stringify(
  //   require("../json/example.mapping20201025-16.11.json")
  // );
  // return <Finish json={exampleMapping}></Finish>;

  const webGLAvailable = WEBGL.isWebGLAvailable();
  if (!webGLAvailable) {
    return <h1>WEBGL.getWebGLErrorMessage()</h1>;
  }

  return (
    <Router
      basename={
        String(window.location).includes("/__/")
          ? "/__/harvester/harvester.html"
          : ""
      }
    >
      <Switch>
        <Route exact path="/">
          <Start />
        </Route>
        <Route path="/flow">
          <Flow
            onFinish={(mappingJson, history) => {
              setMappingJson(mappingJson);
              history.push("/harvester.html/result");
            }}
          />
        </Route>
        <Route path="/harvester.html/result">
          <Finish json={mappingJson} />
        </Route>
      </Switch>
    </Router>
  );
};

const mount = document.querySelector("#mount");
ReactDOM.render(<Harvester />, mount);
