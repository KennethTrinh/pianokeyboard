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

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const noteRange = {
  first: MidiNumbers.fromNote('a0'),
  last: MidiNumbers.fromNote('c8'),
};
const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote: noteRange.first,
  lastNote: noteRange.last,
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
          <Main />
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


function Main() {
  return (
    <div>
      <div className="mt-5">
        <p>
          Responsive piano which resizes to container's width.
        </p>
        <ResponsivePiano />
      </div>
      <div className="mt-5">
        <p>Piano with custom styling - see styles.css</p>
        <ResponsivePiano className="PianoDarkTheme" />
      </div>
    </div>
  );
}
function ResponsivePiano(props) {
  return (
    <DimensionsProvider>
      {({ containerWidth, containerHeight }) => (
        <SoundfontProvider
          instrumentName="acoustic_grand_piano"
          audioContext={audioContext}
          hostname={soundfontHostname}
          render={({ isLoading, playNote, stopNote }) => (
            <Piano
              noteRange={noteRange}
              width={containerWidth}
              playNote={playNote}
              stopNote={stopNote}
              disabled={isLoading}
              {...props}
            />
          )}
        />
      )}
    </DimensionsProvider>
  );
}



class SoundfontProvider extends React.Component {
  static propTypes = {
    instrumentName: PropTypes.string.isRequired,
    hostname: PropTypes.string.isRequired,
    format: PropTypes.oneOf(['mp3', 'ogg']),
    soundfont: PropTypes.oneOf(['MusyngKite', 'FluidR3_GM']),
    audioContext: PropTypes.instanceOf(window.AudioContext),
    render: PropTypes.func,
  };

  static defaultProps = {
    format: 'mp3',
    soundfont: 'MusyngKite',
    instrumentName: 'acoustic_grand_piano',
  };

  constructor(props) {
    super(props);
    this.state = {
      activeAudioNodes: {},
      instrument: null,
    };
  }

  componentDidMount() {
    this.loadInstrument(this.props.instrumentName);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.instrumentName !== this.props.instrumentName) {
      this.loadInstrument(this.props.instrumentName);
    }
  }

  loadInstrument = instrumentName => {
    // Re-trigger loading state
    this.setState({
      instrument: null,
    });
    Soundfont.instrument(this.props.audioContext, instrumentName, {
      format: this.props.format,
      soundfont: this.props.soundfont,
      nameToUrl: (name, soundfont, format) => {
        return `${this.props.hostname}/${soundfont}/${name}-${format}.js`;
      },
    }).then(instrument => {
      this.setState({
        instrument,
      });
    });
  };

  playNote = midiNumber => {
    this.props.audioContext.resume().then(() => {
      const audioNode = this.state.instrument.play(midiNumber);
      this.setState({
        activeAudioNodes: Object.assign({}, this.state.activeAudioNodes, {
          [midiNumber]: audioNode,
        }),
      });
    });
  };

  stopNote = midiNumber => {
    this.props.audioContext.resume().then(() => {
      if (!this.state.activeAudioNodes[midiNumber]) {
        return;
      }
      const audioNode = this.state.activeAudioNodes[midiNumber];
      audioNode.stop();
      this.setState({
        activeAudioNodes: Object.assign({}, this.state.activeAudioNodes, {
          [midiNumber]: null,
        }),
      });
    });
  };

  // Clear any residual notes that don't get called with stopNote
  stopAllNotes = () => {
    this.props.audioContext.resume().then(() => {
      const activeAudioNodes = Object.values(this.state.activeAudioNodes);
      activeAudioNodes.forEach(node => {
        if (node) {
          node.stop();
        }
      });
      this.setState({
        activeAudioNodes: {},
      });
    });
  };

  render() {
    return this.props.render({
      isLoading: !this.state.instrument,
      playNote: this.playNote,
      stopNote: this.stopNote,
      stopAllNotes: this.stopAllNotes,
    });
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