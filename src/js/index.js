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
import { useActions } from "kea";
import totemLogic, { TOTEM_STATES } from "./artwork/logic.totem.js";
import { Provider } from "react-redux";
import { kea, useValues, resetContext, getContext } from "kea";
import md5 from "blueimp-md5";
import { Kontrol } from "@vi.son/components";
import { ExhibitionLayout } from "@vi.son/components";
import { Narrative } from "@vi.son/components";
import { ButtonCloseNarrative } from "@vi.son/components";
import { ButtonOpenNarrative } from "@vi.son/components";
import { ButtonToExhibition } from "@vi.son/components";
import { ButtonDownloadRendering } from "@vi.son/components";
// Local imports
import TotemUI from "./routes/TotemUI.js";
import Intro from "./routes/Intro.js";
import Flow from "./routes/Flow.js";
import TotemRoute from "./routes/TotemRoute.js";
import { get } from "./api.js";
// Style imports
import "@sass/index.sass";

resetContext({
  createStore: {},
  plugins: [],
});

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Artwork = () => {
  const [showNarrative, setShowNarrative] = useState(false);
  const [content, setContent] = useState({});
  const [flowSelection, setFlowSelection] = useState("");

  const { setState } = useActions(totemLogic);
  const { totem } = useValues(totemLogic);

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

  useEffect(() => {
    // switch (history.location.pathname) {
    //   case `/`:
    //     setState(TOTEM_STATES.INIT);
    //     break;
    //   case `/totem`:
    //     setState(TOTEM_STATES.TOTEM);
    //     break;
    // }
  }, [history]);

  useEffect(() => {
    if (totem) {
      showNarrative ? totem.pause() : totem.continue();
    }
  }, [showNarrative]);

  return (
    <ExhibitionLayout
      showAside={showNarrative}
      fixed={
        <>
          <TotemUI paused={showNarrative} />
        </>
      }
      content={
        <Switch>
          <Route path="/flow">
            <div className="ui">
              <Flow />
            </div>
          </Route>

          <Route path="/totem">
            <TotemRoute />
            <ButtonOpenNarrative
              showNarrative={showNarrative}
              setShowNarrative={setShowNarrative}
            />
            <div className="ui">
              <div className="mapping-actions">
                {/* <button */}
                {/*   className="btn-download-json" */}
                {/*   onClick={prepareDownloadJSON} */}
                {/* > */}
                {/*   <span className="emoji">💾</span>{" "} */}
                {/*   <span className="text">Download</span> */}
                {/* </button> */}

                {/* <div className="upload-json"> */}
                {/*   <label className="btn-upload-json" htmlFor="mapping"> */}
                {/*     <span className="emoji">📂</span>{" "} */}
                {/*     <span className="text">Upload</span> */}
                {/*   </label> */}
                {/*   <input */}
                {/*     className="input" */}
                {/*     type="file" */}
                {/*     id="mapping" */}
                {/*     onChange={(e) => { */}
                {/*       const fileReader = new FileReader(); */}
                {/*       const lastFile = */}
                {/*         e.target.files[e.target.files.length - 1]; */}
                {/*       fileReader.readAsText(lastFile); */}
                {/*       fileReader.addEventListener("load", () => { */}
                {/*         const data = JSON.parse(fileReader.result); */}
                {/*         console.log(data); */}
                {/*         setMapping(data); */}
                {/*       }); */}
                {/*     }} */}
                {/*   /> */}
                {/* </div> */}
              </div>

              {/* <button className="btn-restart" onClick={() => history.push("/")}> */}
              {/*    Nochmal */}
              {/* </button> */}
            </div>
          </Route>

          <Route path="/">
            <div className="ui">
              <Intro />
              <ButtonToExhibition />
              <ButtonOpenNarrative
                showNarrative={showNarrative}
                setShowNarrative={setShowNarrative}
              />
            </div>
          </Route>
        </Switch>
      }
      aside={
        <>
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
      }
    />
  );
};

const mount = document.querySelector("#mount");
ReactDOM.render(
  <Router>
    <Provider store={getContext().store}>
      <Artwork />
    </Provider>
  </Router>,
  mount
);
