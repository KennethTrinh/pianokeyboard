import logo from './logo.svg';
import React, { useEffect }  from 'react';
import './css/style.css';
import './css/material.min.css';
import * as Tone from 'tone';
import PropTypes from 'prop-types';
import Soundfont from 'soundfont-player';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import './css/style.css';
import DimensionsProvider from './DimensionsProvider';
import SoundfontProvider from './SoundfontProvider';
import PianoWithRecording from './PianoWithRecording';
import _ from 'lodash';

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const noteRange = {
  first: MidiNumbers.fromNote('a0'),
  last: MidiNumbers.fromNote('c8'),
};
const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote: MidiNumbers.fromNote('c4'),
  lastNote: MidiNumbers.fromNote('c5'),
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
});
function Home() {
  return (
  <div className="mdl-color--grey-100 mdl-color-text--grey-700 mdl-base">
    <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
      <header className="mdl-layout__header">
        <div className="mdl-layout__header-row">
          <img src={logo} id="headerLogo" />
          <span className="mdl-layout-title">Piano</span>
          <div className="mdl-layout-spacer"></div>
        </div>
      </header>
      <main className="mdl-layout__content" style={{flex: '1 0 auto'}}>
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
          <MyApp />
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



class MyApp extends React.Component {
  state = {
    recording: {
      mode: 'RECORDING',
      events: [],
      currentTime: 0,
      currentEvents: [],
    },
  };

  constructor(props) {
    super(props);
    this.scheduledEvents = [];
  }

  getRecordingEndTime = () => {
    if (this.state.recording.events.length === 0) {
      return 0;
    }
    return Math.max(
      ...this.state.recording.events.map(event => event.time + event.duration),
    );
  };

  setRecording = value => {
    this.setState({
      recording: Object.assign({}, this.state.recording, value),
    });
  };

  onClickPlay = () => {
    this.setRecording({
      mode: 'PLAYING',
    });
    const startAndEndTimes = _.uniq(
      _.flatMap(this.state.recording.events, event => [
        event.time,
        event.time + event.duration,
      ]),
    );
    startAndEndTimes.forEach(time => {
      this.scheduledEvents.push(
        setTimeout(() => {
          const currentEvents = this.state.recording.events.filter(event => {
            return event.time <= time && event.time + event.duration > time;
          });
          this.setRecording({
            currentEvents,
          });
        }, time * 1000),
      );
    });
    // Stop at the end
    setTimeout(() => {
      this.onClickStop();
    }, this.getRecordingEndTime() * 1000);
  };

  onClickStop = () => {
    this.scheduledEvents.forEach(scheduledEvent => {
      clearTimeout(scheduledEvent);
    });
    this.setRecording({
      mode: 'RECORDING',
      currentEvents: [],
    });
  };

  onClickClear = () => {
    this.onClickStop();
    this.setRecording({
      events: [],
      mode: 'RECORDING',
      currentEvents: [],
      currentTime: 0,
    });
  };

  render() {
    return (
      <div>
        <div className="mt-5">
        <DimensionsProvider>
          {({ containerWidth, containerHeight }) => (
          <SoundfontProvider
            instrumentName="acoustic_grand_piano"
            audioContext={audioContext}
            hostname={soundfontHostname}
            render={({ isLoading, playNote, stopNote }) => (
              <PianoWithRecording
                recording={this.state.recording}
                setRecording={this.setRecording}
                noteRange={noteRange}
                width={containerWidth}
                keyWidthToHeight={0.2}
                playNote={playNote}
                stopNote={stopNote}
                disabled={isLoading}
                // keyboardShortcuts={keyboardShortcuts}
              />
            )}
          />
          )}
        </DimensionsProvider>
        </div>
        <div className="mt-5">
          <button onClick={this.onClickPlay}>Play</button>
          <button onClick={this.onClickStop}>Stop</button>
          <button onClick={this.onClickClear}>Clear</button>
        </div>
        <div className="mt-5">
          <strong>Recorded notes</strong>
          <div>{JSON.stringify(this.state.recording.events)}</div>
        </div>
      </div>
    );
  }
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