import { useCallback, useState } from "react";
import { MidiNumbers, Piano } from "react-piano";
import "react-piano/dist/styles.css";
import "./App.css";
import "./css/style.css";
import MusicPlayer from "./MusicPlayer";
import Playlist from "./Playlist";
import useWindowDimensions from "./useWindowDimensions";

function PianoKeyboard() {
  const firstNote = MidiNumbers.fromNote("a0");
  const lastNote = MidiNumbers.fromNote("c8");

  const [currentNotes, setCurrentNotes] = useState([]);
  const { height, width } = useWindowDimensions();
  const [currentSong, setCurrentSong] = useState("");
  const [currentSongURL, setCurrentSongURL] = useState("");

  const handleRender = useCallback((notes) => setCurrentNotes(notes), []);

  return (
    <div className="mdl-color--grey-100 mdl-color-text--grey-700 mdl-base">
      <div className="mdl-layout mdl-js-layout mdl-layout--fixed-header"></div>
      <canvas id="visualizationCanvas" width={width} height={height * 0.6} />
      <div>
        <div id="myPiano">
          <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNumber) => {}}
            stopNote={(midiNumber) => {}}
            activeNotes={currentNotes}
            width={width}
            keyWidthToHeight={0.2}
          />
        </div>
        <MusicPlayer
          render={handleRender}
          width={width}
          {...{
            currentSong,
            setCurrentSong,
            currentSongURL,
            setCurrentSongURL,
          }}
        />
        <Playlist
          {...{
            currentSong,
            setCurrentSong,
            currentSongURL,
            setCurrentSongURL,
          }}
        />
      </div>
    </div>
  );
}

export default PianoKeyboard;
