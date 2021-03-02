// node_modules imports
import React from "react";
// Style imports
import "@sass/components/Progressbar.sass";

const Progressbar = ({ percent, completedCount, scenarioCount }) => {
  return (
    <div className="progressbar">
      <div className="bar">
        <div className="completed" style={{ width: `${percent}vw` }}></div>
      </div>
      <div className="completed-text-wrapper">
        <div className="completed-text">
          <h4 className="static-title">Fortschritt</h4>
          <span>
            {completedCount} <span className="divider">/</span> {scenarioCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Progressbar;
