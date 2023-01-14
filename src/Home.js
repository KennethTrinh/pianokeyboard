import logo from './logo.svg';
import React, { useEffect, useState, useRef }  from 'react';
import './css/style.css';
import './css/material.min.css';
import * as Tone from 'tone';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import './css/style.css';
import DimensionsProvider from './DimensionsProvider';
import SoundfontProvider from './SoundfontProvider';
import PianoWithRecording from './PianoWithRecording';
import _ from 'lodash';
import { Midi } from '@tonejs/midi'

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
      < ToneJs />
      </main>
    </div>
  </div>
  );
}

const MidiReader = ({ onMidiArray }) => {
  const [file, setFile] = useState(null);

  const parseFile = file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const midi = new Midi(e.target.result);
      onMidiArray(midi);
    };
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (file) 
      parseFile(file);
  }, [file]);

  return (
    <>
      <input type="file" accept="audio/midi" onChange={(event) => setFile(event.target.files[0])} />
    </>
  );
};

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

  // for debugging: delete when done
  print = value => {
    console.log( {
      recording: {...this.state.recording, ...value}//Object.assign({}, this.state.recording, value),
    });
  };

  setRecording = value => {
    this.setState({
      recording: {...this.state.recording, ...value}//Object.assign({}, this.state.recording, value),
    });
  };

  // if time + duration == time of another event, and the other event has the same midiNumber, add 0.0001
  preprocess = () => {
    const DECREMENT = 0.005;
    let arr = this.state.recording.events;
    let endTimes = {}
    arr.forEach(midi => {
        if (!endTimes[midi.time + midi.duration]) {
            endTimes[midi.time + midi.duration] = []
        }
        endTimes[midi.time + midi.duration].push(midi)
    });
    let corrections = 0
    arr.forEach(midi => {
        if (midi.time in endTimes) {
            let updates = endTimes[midi.time]
            updates.forEach(midiToUpdate => {
                if (midiToUpdate.midiNumber === midi.midiNumber) {
                    midiToUpdate.duration -= DECREMENT;
                    corrections += 1;
                }
            });
        }
    });
    this.setState( {recording: {currentTime: this.state.recording.currentTime - corrections * DECREMENT, events: arr}});
    this.print( {currentTime: this.state.recording.currentTime - corrections * DECREMENT, events: arr});
    }

  onClickPlay = () => {
    this.preprocess();
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

          this.setRecording({currentEvents: currentEvents, mode: 'PLAYING'})
        }, time * 1000)
      );
    });
    // Stop at the end
    setTimeout(() => {
      this.onClickStop();
    }, this.getRecordingEndTime() * 1000);
  };


/*
startNotes = (midis) => {
  return new Promise((resolve) => {
    midis.forEach(midi => {
      this.scheduledEvents.push(setTimeout(() => {
        this.setRecording({ mode:'PLAYING', currentEvents: [midi] });
        resolve();
        console.log('startNotes done');
      }, midi.duration * 1000));
    });
  });
}

stopNotes = (midis) => {
  return new Promise((resolve) => {
    const maxDuration = Math.max(...midis.map(midi => midi.duration));
    setTimeout(() => {
      this.onClickStop();
      resolve();
      console.log('stopNotes done');
    }, maxDuration * (1) * 1000);
  });
}

playNotes = async (midis) => {
  await this.startNotes(midis);
  await this.stopNotes(midis);
  return;
}


  onClickPlay = async () => {
    const buffer = this.state.recording.events;
    // let arr = [[]], time = buffer[0].time;
    // for (let i = 0; i < buffer.length; i++) {
    //   if (buffer[i].time === time) {
    //     arr[arr.length - 1].push(buffer[i]);
    //   } else {
    //     await new Promise(resolve => setTimeout(resolve, console.log( arr[arr.length - 1], time )));
    //     arr.push([buffer[i]]);
    //     time = buffer[i].time;
    //   }
    // }
    await this.playNotes([buffer[0], buffer[3]]);
    await this.playNotes([buffer[1], buffer[4]]);
    await this.playNotes([buffer[2], buffer[5]]);
}
*/


  onClickStop = () => {
    this.scheduledEvents.forEach(scheduledEvent => {
      clearTimeout(scheduledEvent);
    });
    this.setRecording({
      mode: 'RECORDING',
      currentEvents: [],
    });
    this.scheduledEvents = [];
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

  handleMidiArray = (obj) => {
    const allNotes = [];
    obj.tracks.forEach(track => {
      track.notes.forEach(note => {
        allNotes.push({
          "midiNumber": note.midi,
          "time": note.time,
          "duration": note.duration
        });
      });
    });
    this.setRecording({ //this.state.recording.events is the sequence of notes
      events: allNotes,
      currentTime: obj.duration
    });
  };

  test = () => {
    this.setRecording({
      events: [
        { midiNumber: 60, time: 0, duration: 1}, 
        { midiNumber: 60, time: 1, duration: 1}, // 1.01 --> time > prevTime + prevDuration
        { midiNumber: 60, time: 2, duration: 1}, // 2.02
        { midiNumber: 63, time: 0, duration: 2},
        { midiNumber: 64, time: 1, duration: 1}, 
        { midiNumber: 65, time: 2, duration: 1}, 
        // { midiNumber: 96, time: 0, duration: 0.5}, 
        // { midiNumber: 99, time: 0.5, duration: 0.5}, 

      ],
      currentTime: 3
    })
  }

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
          <button onClick={this.test}>Test</button>
        </div>
        <div className="mt-5">
          <strong>Recorded notes</strong>
          <div>{JSON.stringify(this.state.recording.events)}</div>
        </div>
        <MidiReader onMidiArray={this.handleMidiArray} />
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
function ToneJs() {
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