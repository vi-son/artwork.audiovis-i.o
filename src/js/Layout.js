// node_modules imports
import React from "react";
import { Link } from "react-router-dom";
// Style imports
import "../sass/Layout.AudiovisIO.sass";

function Layout({ children, style, className, onClick }) {
  return (
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

export default Layout;
