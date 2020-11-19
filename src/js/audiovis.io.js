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

// const AudiovisIOold = ({ onEnter, onBack, entered }) => {
//   const [mappingJson, setMappingJson] = useState(undefined);

//   const initServiceWorker = () => {
//     if ("serviceWorker" in navigator) {
//       window.addEventListener("load", () => {
//         navigator.serviceWorker
//           .register("/sw.js")
//           .then(registration => {
//             console.log("Serviceworker registered: ", registration);
//           })
//           .catch(registrationError => {
//             console.log(
//               "Serviceworker registration failed: ",
//               registrationError
//             );
//           });
//       });
//     }
//   };

//   const webGLAvailable = WEBGL.isWebGLAvailable();
//   if (!webGLAvailable) {
//     return <h1>WEBGL.getWebGLErrorMessage()</h1>;
//   }

//   return (
//     <div className="audiovisio-wrapper">
//       <Router basename={"/audiovis-io"}>
//         <Switch>
//           <Route exact path="/">
//             <Start onClick={onEnter} />
//           </Route>
//           <Route path="/flow">
//             <Flow
//               onFinish={(mappingJson, history) => {
//                 setMappingJson(mappingJson);
//                 history.push("/result");
//               }}
//             />
//           </Route>
//           <Route path="/result">
//             <Finish json={mappingJson} />
//           </Route>
//         </Switch>
//       </Router>
//     </div>
//   );
// };

const AudiovisIO = ({ onEnter, onBack }) => {
  const [mapping, setMapping] = useState({});

  return (
    <div className="audiovisio-wrapper">
      <Router basename={"/audiovis-io"}>
        <Switch>
          <Route exact path="/">
            <Layout className="start" onBack={onBack}>
              <Start onClick={onEnter} />
            </Layout>
          </Route>

          <Route exact path="/flow">
            <Layout className="layout-flow" onBack={onBack}>
              <Flow
                onFinish={(mapping, history) => {
                  setMapping(mapping);
                  history.push("/result");
                }}
              />
            </Layout>
          </Route>

          <Route exact path="/result">
            <Layout className="finish" onBack={onBack}>
              <Finish mapping={mapping} />
            </Layout>
          </Route>
        </Switch>
      </Router>
    </div>
  );
};

export default AudiovisIO;
