// node_modules imports
import React from "react";
// Style imports
import "../../sass/components/Progressbar.sass";

const Progressbar = ({ percent, completedCount, scenarioCount }) => {
  return (
    <div className="progressbar">
      <div className="completed-text-wrapper">
        <div className="completed-text" style={{ width: `${percent}vw` }}>
          {completedCount} <span className="divider">/</span> {scenarioCount}
        </div>
      </div>
      <div className="bar">
        <div className="completed" style={{ width: `${percent}vw` }}></div>
      </div>
    </div>
  );
};

export default Progressbar;
