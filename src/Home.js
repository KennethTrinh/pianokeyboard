import logo from './logo.svg';
import React, { useEffect }  from 'react';
import './css/style.css';
// import 'http://fonts.googleapis.com/css?family=Roboto:300,400,500,700';
import './css/material.min.css';
import { init } from './pianostudio';
import bufferloader from './bufferloader';
// import jquery from './jquery-2.2.0.min';

function Home() {
  // useEffect(() => {
  //   console.log('hi');
  //   init();
  // }, []);
  return (
  <body className="mdl-color--grey-100 mdl-color-text--grey-700 mdl-base">
    <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
      <header className="mdl-layout__header">
        <div className="mdl-layout__header-row">
          <img src={logo} id="headerLogo" />
          <span className="mdl-layout-title">Piano Studio</span>
          <div className="mdl-layout-spacer"></div>
          <nav className="mdl-navigation">
            <a className="h-button mdl-button mdl-js-button mdl-js-ripple-effect" href="#">
              <span className="h-link-text">Piano</span>
            </a>
            <a className="h-button mdl-button mdl-js-button mdl-js-ripple-effect" href="help.html">
              <span className="h-link-text">Help</span>
            </a>
          </nav>
        </div>
      </header>
      <main className="mdl-layout__content" style={{flex: '1 0 auto'}}>
        <div id="loadingBar" className="mdl-progress mdl-js-progress mdl-progress__indeterminate"><br />Loading audio...
        </div>
        <div id="loaded">
          <table className="spacer">
            <tr>
              <td style={{paddingRight: '15px'}}>
                <button id="customTrackBtn"
                        className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--colored">
                        Upload Track
                </button>
                <input id="customTrackFile" type="file" name="customTrack" accept="audio/*" style={{display: 'none'}}>
                </input>
              </td>
              <td style={{paddingRight: '40px'}}>
                  <label className="mdl-switch mdl-js-switch mdl-js-ripple-effect" htmlFor="customTrackToggle">
                      <input id="customTrackFile" type="file" name="customTrack" accept="audio/*" style={{display: 'none'}}>
                      </input>
                <span className="mdl-switch__label">Uploaded Track</span>
                  </label>
              </td>
              <td>
                <label className="mdl-switch mdl-js-switch mdl-js-ripple-effect" htmlFor="sampleTrackToggle">
                    <input type="checkbox" id="sampleTrackToggle" className="mdl-switch__input" />
                    <span className="mdl-switch__label">Sample Track</span>
                    </label>
              </td>
            </tr>
          </table>
          <table className="spacer">
              <tr>
                  <td>
                      <label>Piano Volume
                        <input id="pianoVolume" className="mdl-slider mdl-js-slider" type="range" min="0" max="1" step="0.1" value="0.5" />
                      </label>
                  </td>
                  <td>
                    <label>Sample Volume
                      <input id="sampleVolume" className="mdl-slider mdl-js-slider" type="range" min="0" max="1" step="0.1" value="0.5" />
                    </label>
                  </td>
              </tr>
          </table>
          <div id="piano" className="mdl-grid">
              <div id="piano-left" className="mdl-cell mdl-cell--6-col mdl-cell--4-col-phone">
              </div>
              <div id="piano-right" className="mdl-cell mdl-cell--6-col mdl-cell--4-col-phone">
              </div>
          </div>
        </div>
      </main>
    </div>
  </body>





    // <div className="App">
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />
    //     <p>
    //       Homepage
    //     </p>
    //   </header>
    // </div>

  );
}
export default Home;