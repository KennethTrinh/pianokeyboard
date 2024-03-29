import './App.css';
import './css/style.css';
import MusicPlayer from './MusicPlayer';
import { Piano, MidiNumbers } from 'react-piano';
import Playlist from './Playlist';
import 'react-piano/dist/styles.css';
import { useState } from 'react';
import useWindowDimensions from './useWindowDimensions';


function PianoKeyboard() {
  const firstNote = MidiNumbers.fromNote('a0');
  const lastNote = MidiNumbers.fromNote('c8');

  const [currentNotes, setCurrentNotes] = useState([]);
  const { height, width } = useWindowDimensions(); 
  const [currentSong, setCurrentSong] = useState('');
  const [currentSongURL, setCurrentSongURL] = useState('');


  return (  
    <div className="mdl-color--grey-100 mdl-color-text--grey-700 mdl-base"> 
    <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header">
    <header className="mdl-layout__header" style={{border: "20px solid white"}}/>
    </div>
    <canvas id="visualizationCanvas" width={width} height={height*0.4} />
      <div >
        <div id="myPiano">
        <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNumber) => { }}
            stopNote={(midiNumber) => { }}
            activeNotes={currentNotes}
            width={width}
            keyWidthToHeight={0.2}
        /> 
        </div>
        <MusicPlayer 
            render={( currentNotes ) => { setCurrentNotes(currentNotes) }} 
            width={width} 
            {...{currentSong, setCurrentSong, currentSongURL, setCurrentSongURL}} 
        />
        <Playlist {...{currentSong, setCurrentSong, currentSongURL, setCurrentSongURL}} />
      </div>
    </div>
  );
}



export default PianoKeyboard;
