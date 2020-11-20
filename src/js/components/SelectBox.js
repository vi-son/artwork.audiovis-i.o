// node_modules imports
import React from "react";
// Style imports
import "../../sass/components/SelectBox.sass";

export default class SelectBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: -1
    };
    this.init = this.init.bind(this);
  }

  init() {
    this.setState({ selection: -1 });
  }

  render() {
    return (
      <div className="select">
        <div className="options">
          <div className="description">
            <h3>
              <span className="emoji">🧩</span> 2. Zuordnung
            </h3>
            <article>
              Entscheide dich für <b>eine</b> Kategorie
            </article>
          </div>
          <div className="icons">
            {this.props.options.map((o, i) => {
              return (
                <div
                  key={o}
                  className={[
                    "icon",
                    this.state.selection !== -1 && i === this.state.selection
                      ? "selected"
                      : "",
                    this.state.selection !== -1 && i !== this.state.selection
                      ? "not-selected"
                      : ""
                  ].join(" ")}
                  onClick={() => {
                    this.setState({ selection: i });
                    this.props.onIndexChange(i, this.props.options[i]);
                  }}
                >
                  <h5>{o}</h5>
                  {this.props.icons[i]}
                </div>
              );
            })}
          </div>
        </div>
        {React.Children.map(this.props.children, (child, i) =>
          i === this.state.selection ? child : null
        )}
      </div>
    );
  }
}
