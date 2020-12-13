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
    this.restoreTotem = this.restoreTotem.bind(this);
    this.totemIdRef = React.createRef();
    this.state = {
      totem: undefined,
      mapping: this.props.mapping
    };
  }

  restoreTotem() {
    const id = this.totemIdRef.current.value;
    console.log(id);
    const url =
      process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:3000/entry"
        : "https://barn.mixing-senses.art/entry";
    fetch(`${url}/${id}`)
      .then(res => res.json())
      .then(json => {
        console.log(json);
      })
      .catch(err => {
        console.error(err);
      });
  }

  storeOnline() {
    if (this.props.mapping === undefined) return;
    const totem = `${md5(JSON.stringify(this.props.mapping))}`;
    const date = new Date();
    const payload = JSON.stringify({
      totem: totem,
      date: date,
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
        console.log(`Stored Totem with Totem ID: ${res.totemId}`);
        this.setState({ totem: res.totem });
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
                💾 Download des Totems (.json)
              </button>
              <button className="btn-secondary" onClick={this.storeOnline}>
                ☁️ Online Speichern
              </button>

              <div className="restore-totem">
                <label>Totem ID:</label>
                <input type="text" ref={this.totemIdRef} />
                <button onClick={this.restoreTotem}>Wiederherstellen</button>
              </div>
            </div>
          </div>
          {this.state.totem ? (
            <div className="stored-with-session-id">
              <span>Gespeichert unter der ID</span>
              <b>{this.state.totem}</b>
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
