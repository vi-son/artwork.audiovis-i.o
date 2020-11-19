// node_modules imports
import React from "react";
import { Link } from "react-router-dom";
// Style imports
import "../sass/components/Layout.sass";

const Layout = ({ children, style, className, onBack }) => {
  return (
    <div className={["layout", className].join(" ")} style={style}>
      {children}
      {/* <button className="btn-to-meta" onClick={onBack}> */}
      {/*   Zurück */}
      {/* </button> */}
    </div>
  );
};

export default Layout;
