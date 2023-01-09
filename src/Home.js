import logo from './logo.svg';
import React, { useEffect }  from 'react';
import './css/style.css';
// import 'http://fonts.googleapis.com/css?family=Roboto:300,400,500,700';
import './css/material.min.css';
import { init } from './pianostudio';
import bufferloader from './bufferloader';
// import { Synth, now } from 'tone';
import * as Tone from 'tone';

function Home() {
  useEffect(() => {
    console.log('<body> of application loaded');
    console.log(document.getElementById('loadingBar'));
    init();
  }, []);
  return (
  <div className="mdl-color--grey-100 mdl-color-text--grey-700 mdl-base">
    <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
      <header className="mdl-layout__header">
        <div className="mdl-layout__header-row">
          <img src={logo} id="headerLogo" />
          <span className="mdl-layout-title">Piano</span>
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
        <div>
          <table className="spacer">
            <tbody>
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
                      <input type="checkbox" id="customTrackToggle" className="mdl-switch__input" onChange={event => console.log(event.target.value)} />
                <span className="mdl-switch__label">Uploaded Track</span>
                  </label>
              </td>
              <td>
                <label className="mdl-switch mdl-js-switch mdl-js-ripple-effect" htmlFor="sampleTrackToggle">
                    <input type="checkbox" id="sampleTrackToggle" className="mdl-switch__input"   onChange={event => console.log(event.target.value)} />
                    <span className="mdl-switch__label">Sample Track</span>
                    </label>
              </td>
            </tr>
            </tbody>
          </table>
          <table className="spacer">
              <tbody>
              <tr>
                  <td>
                      <label>Piano Volume
                        <input id="pianoVolume" className="mdl-slider mdl-js-slider" type="range" min="0" max="1" step="0.1" onChange={event => console.log(event.target.value)} defaultValue={0.5}/>
                      </label>
                  </td>
                  <td>
                    <label>Sample Volume
                      <input id="sampleVolume" className="mdl-slider mdl-js-slider" type="range" min="0" max="1" step="0.1" onChange={event => console.log(event.target.value)} defaultValue={0.5}/>
                    </label>
                  </td>
              </tr>
              </tbody>
          </table>
          <canvas id="pianoCanvas" width="1280" height="300" style={{ marginTop: '10px' }} />
          <div className="spacer">
            <canvas id="visualizationCanvas" width="1280" height="300" />
          </div>
        </div>
      < MyComponent />
      </main>
    </div>
  </div>
  );
}

const synth = new Tone.Synth().toDestination();
synth.oscillator.type = 'sine';
synth.envelope.attack = 0.001;
synth.envelope.decay = 0.1;
synth.envelope.sustain = 0.1;
synth.envelope.release = 0.1;
function MyComponent() {
  // Schedule a change in the oscillator's frequency
  synth.oscillator.frequency.setValueAtTime(440, Tone.now() + 1);

  // Cancel the scheduled change
  synth.oscillator.frequency.cancelScheduledValues(Tone.now() + 1);

  return (
    <div>
      <button onClick={() => synth.triggerAttackRelease('C4', '4n', Tone.now(), 0.5)}>
        Play C4
      </button>
    </div>
  );
}
export default Home;