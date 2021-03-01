// node_modules imports
import React from "react";
import { Link } from "react-router-dom";
// Style imports
import "@sass/routes/Intro.sass";

const Intro = () => {
  return (
    <main className="intro">
      <h2 className="heading">audiovis i/o</h2>
      <article className="text">
        Audiovis I/O ist ein audiovisuelle Experiment. Wir lassen dich kurzer
        Musikschnipsel (Samples) hören, zu denen du auswählst, was du fühlst,
        spürst oder dir vorstellst.
        <br />
        Zu jedem Sample hast du <b>drei Möglichkeiten</b>, von denen du eine
        auswählst, um deinen Eindruck der Musik zuzuordnen: Emotion Farbe oder
        Form
        <br />
        <b>
          Viel Spaß <span className="emoji">🎉</span>
        </b>
      </article>
      <Link className="btn to-flow" to="/flow">
        Loslegen
      </Link>
    </main>
  );
};

export default Intro;
