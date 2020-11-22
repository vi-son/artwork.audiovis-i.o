// node_modules imports
import React from "react";
import { Link } from "react-router-dom";
// SVG imports
import Illustration from "../../../assets/svg/audiovisio/title-illustration.svg";
// Style imports
import "../../sass/routes/Start.sass";

const Start = ({ onBack }) => {
  return (
    <main className="two-columns">
      <div className="left">
        <h2 className="heading">audiovis i/o</h2>
        <article className="text">
          <b>Herzlich willkommen</b>, du bist im Begriff Kunst zu machen.
          <br />
          <br />
          In den nächsten Minuten kannst du uns helfen, kreativ zu sein.
          Audiovis I/O ist ein audiovisuelle Experiment. Wir lassen dich Samples
          hören, zu denen du uns sagen kannst, was du dazu fühlst, spürst oder
          dir vorstellst.
          <br />
          <br />
          Ein Sample ist ein <b>kurzer Musikschnipsel</b>, der beliebig kurz
          oder lang sein kann und in andere Kontexte überführt wird – das nennt
          sich dann musikalische Weiterverarbeitung.
          <b>
            Zu jedem Sample geben wir dir drei Möglichkeiten, von denen du eine
            auswählst, um dem Sample deinen Eindruck zuzuordnen
          </b>
          . Das machst du, indem du eine Emotion auswählst, einen Farbwert
          findest oder eine passende Form aussuchst. Das Interface lässt sich
          ganz einfach mit der Maus bedienen.
          <br />
          <br />
          Alle inhaltlichen Infos hierzu findest du im{" "}
          <a onClick={onBack}>Ausstellungsbereich</a>.
          <br />
          <br />
          <b>Viel Spaß</b>
        </article>
      </div>
      <div className="right">
        <div className="illustration-wrapper">
          <Illustration />
        </div>
        <Link className="start-button" to="/flow">
          Loslegen
        </Link>
        <a
          className="btn-secondary"
          href="https://exhibition.mixing-senses.art"
        >
          Zurück zur Ausstellung
        </a>
      </div>
    </main>
  );
};

export default Start;
