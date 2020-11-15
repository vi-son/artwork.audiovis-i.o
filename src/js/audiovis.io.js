// node_modules imports
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
// Local imports: Routes
import { WEBGL } from "./utils/webgl.js";
import Flow from "./routes/Flow.js";
import Start from "./routes/Start.js";
import Finish from "./routes/Finish.js";
// Style imports
import "../sass/audiovis.io.sass";

const AudiovisIO = ({onEnter, onBack, entered}) => {
  const [mappingJson, setMappingJson] = useState(undefined);

  const initServiceWorker = () => {
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
  };

  const webGLAvailable = WEBGL.isWebGLAvailable();
  if (!webGLAvailable) {
    return <h1>WEBGL.getWebGLErrorMessage()</h1>;
  }

  useEffect(() => {
    initServiceWorker();
  });

  return (
    <div className="audiovisio-wrapper">
      <Router
               basename={"/audiovisio"}
             >
               <Switch>
                 <Route exact path="/">
                   <Start onClick={onEnter}/>
                 </Route>
                 <Route path="/flow">
                   <Flow
                     onFinish={(mappingJson, history) => {
                       setMappingJson(mappingJson);
                       history.push("/result");
                     }}
                   />
                 </Route>
                 <Route path="/result">
                   <Finish json={mappingJson} />
                 </Route>
               </Switch>
      </Router>
      </div>
    );
};

export default AudiovisIO;

// export default ({onEnter}) => {
//   return (
//     <div onClick={onEnter} style={{width: "100vw", height: "100vh", background: "red", position: "fixed", top: 0}}>
//       TEST
//     </div>
//   )
// }

// const mount = document.querySelector("#mount");
// ReactDOM.render(<Harvester />, mount);
