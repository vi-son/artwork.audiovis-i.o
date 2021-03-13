import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useLocation,
  useHistory,
} from "react-router-dom";
import md5 from "blueimp-md5";
import { Narrative } from "@vi.son/components";
import { ButtonCloseNarrative } from "@vi.son/components";
import { ButtonOpenNarrative } from "@vi.son/components";
import { ButtonToExhibition } from "@vi.son/components";
import { ButtonDownloadRendering } from "@vi.son/components";
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
  const [flowSelection, setFlowSelection] = useState("");
  const [mapping, setMapping] = useState(exampleMapping);

  const history = useHistory();
  const query = useQuery();

  const prepareDownloadJSON = () => {
    const downloadLink = document.createElement("a");
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(mapping));
    downloadLink.href = dataStr;
    downloadLink.download = `${md5(JSON.stringify(mapping))}.json`;
    document.body.append(downloadLink);
    downloadLink.click();
  };

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
      <h1>{JSON.stringify(flowSelection)}</h1>
      <div className="artwork">
        <Totem
          mapping={mapping}
          paused={showNarrative}
          state={query.get("state")}
          onSelect={(s) => setFlowSelection(s)}
        />
        <ButtonDownloadRendering
          canvasRef={document.querySelector(".canvas")}
        />
        <button className="btn-download-json" onClick={prepareDownloadJSON}>
          JSON
        </button>
        <div className="btn-upload-json">
          <button>Upload JSON</button>
          <input
            type="file"
            onChange={(e) => {
              const fileReader = new FileReader();
              const lastFile = e.target.files[e.target.files.length - 1];
              fileReader.readAsText(lastFile);
              fileReader.addEventListener("load", () => {
                const data = JSON.parse(fileReader.result);
                console.log(data);
                setMapping(data);
              });
            }}
          />
        </div>
      </div>

      <div>
        <Switch>
          <Route path="/flow">
            <div className="ui">
              <Flow
                selection={flowSelection}
                onFinish={(mapping) => {
                  setMapping(mapping);
                  history.push("/end?state=totem");
                }}
                onClear={() => setFlowSelection("")}
              />
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
