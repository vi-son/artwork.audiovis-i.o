import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { Narrative } from "@vi.son/components";
import { ButtonCloseNarrative } from "@vi.son/components";
import { ButtonOpenNarrative } from "@vi.son/components";
import { ButtonToExhibition } from "@vi.son/components";
// Local imports
import Totem from "./artwork/Totem.js";
import Intro from "./routes/Intro.js";
import Flow from "./routes/Flow.js";
import { get } from "./api.js";
// Style imports
import "@sass/index.sass";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Artwork = () => {
  const [showNarrative, setShowNarrative] = useState(false);
  const [content, setContent] = useState({});

  const exampleMapping = require("../json/08f406489239afeddc1391e4125cf37b.json");
  const mapping = undefined;

  const query = useQuery();

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
      {query.get("state")}
      <div className="artwork">
        {mapping !== undefined ? (
          <Totem
            mapping={mapping}
            paused={showNarrative}
            state={query.get("state")}
          />
        ) : (
          <Totem
            mapping={exampleMapping}
            paused={showNarrative}
            state={query.get("state")}
          />
        )}
      </div>

      <div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">start</Link>
            </li>
            <li>
              <Link to="/flow?state=color-input">flow/color</Link>
              <Link to="/flow?state=shape-input">flow/shape</Link>
              <Link to="/flow?state=feeling-input">flow/feeling</Link>
            </li>
            <li>
              <Link to="/end?state=totem">end</Link>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route path="/flow">
            <div className="ui">
              <Flow />
              <ButtonOpenNarrative
                showNarrative={showNarrative}
                setShowNarrative={setShowNarrative}
              />
            </div>
          </Route>
          <Route path="/end">
            <div className="ui">
              <ButtonOpenNarrative
                showNarrative={showNarrative}
                setShowNarrative={setShowNarrative}
              />
            </div>
          </Route>
          <Route path="/">
            <div className="ui">
              <Intro />
            </div>
          </Route>
        </Switch>
      </div>

      <ButtonToExhibition />

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
ReactDOM.render(
  <Router>
    <Artwork />
  </Router>,
  mount
);
