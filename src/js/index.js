import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { Narrative } from "@vi.son/components";
import { ButtonCloseNarrative } from "@vi.son/components";
import { ButtonOpenNarrative } from "@vi.son/components";
import { ButtonToExhibition } from "@vi.son/components";
// Local imports
import Totem from "./components/Totem.js";
import { get } from "./api.js";
// Style imports
import "../sass/index.sass";

const Artwork = () => {
  const [showNarrative, setShowNarrative] = useState(false);
  const [content, setContent] = useState({});

  const exampleMapping = require("../json/08f406489239afeddc1391e4125cf37b.json");
  const mapping = undefined;

  useEffect(() => {
    console.group("Version");
    console.log(process.env.VERSION);
    console.groupEnd();
    get(`/pages/audiovis-io`).then((d) => {
      setContent(d.content);
    });
  }, []);

  return (
    <>
      <div className="artwork">
        {mapping !== undefined ? (
          <Totem mapping={mapping} paused={showNarrative} />
        ) : (
          <Totem mapping={exampleMapping} paused={showNarrative} />
        )}

        <ButtonOpenNarrative
          showNarrative={showNarrative}
          setShowNarrative={setShowNarrative}
        />
      </div>

      <Router>
        <div>
          <nav className="nav">
            <ul>
              <li>
                <Link to="/">start</Link>
              </li>
              <li>
                <Link to="/flow">flow</Link>
              </li>
              <li>
                <Link to="/end">end</Link>
              </li>
            </ul>
          </nav>

          <Switch>
            <Route path="/flow">
              <h1 className="ui">Flow</h1>
            </Route>
            <Route path="/end">
              <h1 className="ui">End</h1>
            </Route>
            <Route path="/">
              <h1 className="ui">Start</h1>
            </Route>
          </Switch>
        </div>
      </Router>

      {/* <ButtonToExhibition /> */}

      <ButtonCloseNarrative
        showNarrative={showNarrative}
        setShowNarrative={setShowNarrative}
      />
      <Narrative
        show={showNarrative}
        version={process.env.VERSION}
        content={content}
      />
    </>
  );
};

const mount = document.querySelector("#mount");
ReactDOM.render(<Artwork />, mount);
