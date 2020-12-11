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
      //   <Router basename={"/audiovis-io"}>
      //     <Switch>
      //       <Route exact path="/">
      //         <Layout className="start" onBack={this.props.onBack}>
      //           <Start onClick={this.props.onEnter} />
      //         </Layout>
      //       </Route>

      //       <Route exact path="/flow">
      //         <Layout className="layout-flow" onBack={this.props.onBack}>
      //           <Flow
      //             onFinish={(mapping, history) => {
      //               this.setState({ mapping: mapping });
      //               history.push("/result");
      //             }}
      //           />
      //         </Layout>
      //       </Route>

      //       <Route exact path="/result">
      //         <Layout className="finish" onBack={this.props.onBack}>
      //           <Finish mapping={this.state.mapping} />
      //         </Layout>
      //       </Route>
      //     </Switch>
      //   </Router>
      // </div>
    );
  }
}

export default AudiovisIO;
