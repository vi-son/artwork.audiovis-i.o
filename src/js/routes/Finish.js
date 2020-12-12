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
    this.storeOnline = this.storeOnline.bind(this);
    this.state = {
      sessionId: undefined
    };
  }

  storeOnline() {
    if (this.props.mapping === undefined) return;
    const session = `${md5(JSON.stringify(this.props.mapping))}`;
    const payload = JSON.stringify({
      session: session,
      mappings: this.props.mapping
    });
    console.log(payload);
    const url =
      process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:3000/entry"
        : "https://barn.mixing-senses.art/entry";
    fetch(url, { method: "POST", body: payload })
      .then(res => res.json())
      .then(res => {
        console.log(`Stored Totem with Session ID: ${res.session}`);
        this.setState({ sessionId: res.session });
      })
      .catch(err => {
        console.error(err);
      });
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
                🤟🏼 Noch eine Runde
              </Link>
              <a
                className="btn-secondary"
                href="https://exhibition.mixing-senses.art"
              >
                🏛️ Zum Foyer
              </a>
              <button className="btn-secondary" onClick={this.prepareDownload}>
                💾 download daten
              </button>
              <button className="btn-secondary" onClick={this.storeOnline}>
                ☁️ online speichern
              </button>
            </div>
          </div>
          {this.state.sessionId ? (
            <div className="stored-with-session-id">
              <span>Gespeichert unter der ID</span>
              <b>{this.state.sessionId}</b>
            </div>
          ) : (
            <></>
          )}
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

export default Finish;
