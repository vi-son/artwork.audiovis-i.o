// node_modules imports
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import md5 from "blueimp-md5";
// Local imports
import Layout from "../Layout.js";
import Totem from "../components/Totem.js";
// Style imports
import "../../sass/routes/Finish.sass";

class Finish extends React.Component {
  constructor(props) {
    super(props);
    // JSON
    this.exampleMapping = require("../../json/08f406489239afeddc1391e4125cf37b.json");
    this.prepareDownload = this.prepareDownload.bind(this);
  }

  prepareDownload() {
    const downloadLink = document.createElement("a");
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(this.props.mapping));
    downloadLink.href = dataStr;
    downloadLink.download = `${md5(JSON.stringify(this.props.mapping))}.json`;
    document.body.append(downloadLink);
    downloadLink.click();
  }

  render() {
    return (
      <Layout className="finish">
        <main className="two-columns">
          <div className="textblock">
            <header className="title">
              <span className="emoji">&#127881;</span>
              <h2 className="title">Glückwunsch</h2>
            </header>
            <article>
              Du hast <b>5 Zuordnungen</b> abgeschlossen.
            </article>
            <br />
            <article className="token-heading">
              Wir haben ein <b>Totem</b> aus deinen Zuordnungen generiert,
              welches du dir rechts anschauen kannst.
            </article>
            <div className="buttons">
              <Link className="btn-primary" to="/flow">
                Noch eine Runde
              </Link>
              <button className="btn-secondary" onClick={this.prepareDownload}>
                download daten
              </button>
            </div>
          </div>
          <div className="totem">
            {this.props.mapping !== undefined ? (
              <Totem ref={this.totemRef} mapping={this.props.mapping} />
            ) : (
              <Totem ref={this.totemRef} mapping={this.exampleMapping} />
            )}
          </div>
        </main>
      </Layout>
    );
  }
}

// function FinishOld({ json }) {
//   const canvasRef = useRef();

//   const mappings = json !== undefined ? JSON.parse(json) : [];

//   const prepareDownload = () => {
//     const downloadLink = document.createElement("a");
//     const dataStr =
//       "data:text/json;charset=utf-8," +
//       encodeURIComponent(JSON.stringify(mappings));
//     downloadLink.href = dataStr;
//     downloadLink.download = `${md5(JSON.stringify(mappings))}.json`;
//     document.body.append(downloadLink);
//     downloadLink.click();
//   };

//   return (
//     <Layout className="audiovis-io-finish">
//       <main className="finish">
//         <div className="textblock">
//           <div>
//             <span className="emoji">&#127881;</span>
//             <h2 className="title">Glückwunsch</h2>
//             <article>
//               Du hast <b>5 Zuordnungen</b> abgeschlossen.
//             </article>
//             <br />
//             <article className="token-heading">
//               Wir haben ein <b>Totem</b> aus deinen Zuordnungen generiert,
//               welches du rechts erkunden kannst.
//             </article>
//           </div>
//         </div>
//         <div className="totem">
//           {json !== undefined ? <Totem mapping={mappings}></Totem> : <></>}
//         </div>
//         <div className="buttons">
//           <button onClick={prepareDownload}>download daten</button>
//           <Link to="/flow">Noch eine Runde</Link>
//         </div>
//       </main>
//     </Layout>
//   );
// }

export default Finish;
