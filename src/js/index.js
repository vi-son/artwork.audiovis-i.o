import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Narrative } from "@vi.son/components";
import { ButtonCloseNarrative } from "@vi.son/components";
import { ButtonOpenNarrative } from "@vi.son/components";
import { ButtonToExhibition } from "@vi.son/components";
// Local imports
import Totem from "./components/Totem.js";
import { get } from "./api.js";
// Style imports
import "@vi.son/rouge/index.sass";
// import "../sass/index.sass";

const Artwork = () => {
  const [showNarrative, setShowNarrative] = useState(true);
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
          <Totem mapping={mapping} />
        ) : (
          <Totem mapping={exampleMapping} />
        )}

        <ButtonOpenNarrative
          showNarrative={showNarrative}
          setShowNarrative={setShowNarrative}
        />
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
ReactDOM.render(<Artwork />, mount);
