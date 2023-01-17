import './App.css';
import './css/style.css';
import logo from './logo.svg';
import AudioPlayer from './AudioPlayer';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import { useState } from 'react';
import useWindowDimensions from './useWindowDimensions';
import * as Tone from 'tone';


function PianoKeyboard() {
  const firstNote = MidiNumbers.fromNote('a0');
  const lastNote = MidiNumbers.fromNote('c8');
//   const keyboardShortcuts = KeyboardShortcuts.create({
//     firstNote: firstNote,
//     lastNote: lastNote,
//     keyboardConfig: KeyboardShortcuts.HOME_ROW,
//   });
  const [currentNotes, setCurrentNotes] = useState([]);
  const { height, width } = useWindowDimensions();
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const handleButtonClick = () => {
    setAudioUnlocked(true);
    Tone.start();
  }

  return (  
    <div className="mdl-color--grey-100 mdl-color-text--grey-700 mdl-base" onClick={handleButtonClick}> 
    <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
    <header className="mdl-layout__header">
        <div className="mdl-layout__header-row">
          <img src={logo} id="headerLogo" />
          <span className="mdl-layout-title">Piano</span>
          <div className="mdl-layout-spacer"></div>
        </div>
    </header>
    </div>
    <canvas id="visualizationCanvas" width={width} height="300" />
      {audioUnlocked ? ( <div>
        <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNumber) => { }}
            stopNote={(midiNumber) => { }}
            activeNotes={currentNotes}
            width={width}
            keyWidthToHeight={0.2}
            // keyboardShortcuts={keyboardShortcuts}
        /> 
        <AudioPlayer render={( currentNotes ) => { setCurrentNotes(currentNotes) }} width={width} />



        </div>): <div width="1280" height="300" style={{textAlign: 'center', fontSize: '50px'}}> Click to Unlock Audio </div> } 
    </div>
  );
}



export default PianoKeyboard;
