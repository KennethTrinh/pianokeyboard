import React, { useState, useRef, useEffect } from 'react';
import { getPlayer, getCurrentSong } from "./js/player/Player.js"

const MusicPlayer = (props) => {
  const [noteSequence, setNoteSequence] = useState(null);
  const [playButtonDisabled, setPlayButtonDisabled] = useState(true);
  const [stopButtonDisabled, setStopButtonDisabled] = useState(true);
  const [pauseButtonDisabled, setPauseButtonDisabled] = useState(true);
  const [resumeButtonDisabled, setResumeButtonDisabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationId = useRef();
  
  const [progressValue, setProgressValue] = useState(0);
  const [pitchValue, setPitchValue] = useState(0);
  const [speedValue, setSpeedValue] = useState(1);

  const DURATION_WINDOW = 3;
  const [span, setSpan] = useState(0);
  
  useEffect( () => {
    if (noteSequence) {  // if previously playing
        setIsPlaying(false);
        getPlayer().stop();
        setPlayButtonDisabled(false);
        setStopButtonDisabled(true);
        setPauseButtonDisabled(true);
        setResumeButtonDisabled(true);
    }
    if (props.currentSongURL) {
      let f = props.currentSongURL;
      let reader = new FileReader();
      reader.onload = async () => {
        await getPlayer().loadSong(reader.result, f.name);
        const ns = getCurrentSong().getNoteSequence().map(midi => ({
          pitch: midi.midiNoteNumber,
          startTime: midi.timestamp / 1000,
          endTime: (midi.timestamp + midi.duration) / 1000,
          velocity: midi.velocity
        }));
        setNoteSequence(ns);
        setSpan(computeSpan(ns));
        if (ns)
          setPlayButtonDisabled(false);
      }
      reader.readAsDataURL(f);
    }
  }, [props.currentSongURL]);

  const computeSpan = (ns) => {
    /*
    ns = [
    {pitch: 45, startTime: 1.142856, endTime: 3.142854, velocity: 50},
    {pitch: 33, startTime: 1.142856, endTime: 2.285712, velocity: 50},
    ]
    ns is a list of note objects, where each note is sorted by start time
    assume DURATION_WINDOW = 3 is a window striding across ns, and we want to find the 
    maximum number notes playing in the window -- sweep line for O(nlogn) !
    */
    let events = [];
    for (let note of ns) {
        events.push({time: Math.floor(note.startTime / DURATION_WINDOW), change: 1});
        events.push({time: Math.floor(note.endTime / DURATION_WINDOW) + 1, change: -1}); // end + 1 because the note stops playing in the next window
    }
    events.sort((a, b) => a.time - b.time);
    let [max, current] = [0, 0];
    for (let event of events) {
        current += event.change;
        max = Math.max(max, current);
    }
    return max;
  }

  const binarySearch = (noteObjects, currentTime) => {
    let left = 0;
    let right = noteObjects.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (noteObjects[mid].startTime <= currentTime && currentTime < noteObjects[mid].endTime) {
        return mid;
      } else if (currentTime < noteObjects[mid].startTime) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    if (noteObjects[left] && noteObjects[right] && left === right + 1) {
      return Math.abs(currentTime - noteObjects[left].startTime) < Math.abs(currentTime - noteObjects[right].startTime) ? left : right;
    }
    return -1;
  }

  const processAudio = () => {
    if (noteSequence) {
        const currentTime = getPlayer().getTime();
        const currentNoteIndex = binarySearch(noteSequence, currentTime);
        const startIndex = Math.max(0, currentNoteIndex - span); 
        const endIndex = Math.min(noteSequence.length, currentNoteIndex + span);
        const buffer = noteSequence.slice(startIndex, endIndex);
        const currentNotes = currentNoteIndex === -1 ? [] :  
                  buffer.filter(note => {
                  return currentTime >= note.startTime && currentTime < note.endTime;
              });
        drawCanvas(buffer);
        props.render(currentNotes.map( note => note.pitch + pitchValue)); //calls setCurrentNotes in PianoKeyboard.js
        
    }
  }
  const drawCanvas = (notes) => {
    let canvas = document.getElementById("visualizationCanvas");
    let canvasContext = canvas.getContext("2d");
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    let grd = canvasContext.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, 'white');   // top
    grd.addColorStop(1, 'pink');  // bottom
    canvasContext.fillStyle = grd;
    canvasContext.strokeStyle = '#ff69b4';
    canvasContext.lineWidth = 2;
    const currentTime = getPlayer().getTime();
    notes = notes.filter(note => note.pitch + pitchValue >= 21 && note.pitch + pitchValue <= 108);
    notes.forEach(note => {
        const { startWidth, endWidth } = findKeyPosition(note.pitch);
        const startY = canvas.height - (note.startTime - currentTime) / (DURATION_WINDOW) * canvas.height;
        const endY = canvas.height - (note.endTime - currentTime) / (DURATION_WINDOW) * canvas.height;
        if (note.startTime <= currentTime + DURATION_WINDOW) {
            canvasContext.fillRect(startWidth, startY, endWidth - startWidth, endY - startY);
            canvasContext.strokeRect(startWidth, startY, endWidth - startWidth, endY - startY);
        }
    });
  }


  const findKeyPosition = (midiNumber) => {
    const keyboard = document.getElementsByClassName("ReactPiano__Keyboard")[0];
    const keyboardWidth = keyboard.offsetWidth;
    const keys = keyboard.children; 
    let count = 21;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (count === midiNumber + pitchValue) {
            return {
                startWidth: parseFloat(key.style.left) * keyboardWidth / 100,
                endWidth: (parseFloat(key.style.left) + parseFloat(key.style.width)) * keyboardWidth / 100
            };
        }
        count++;
    }
  }


const audioLoop = () => {
      setProgressValue(getPlayer().getTime());
      processAudio();
      if (getPlayer().getTime() > getCurrentSong().getEnd()/ 1000) {
          setIsPlaying(false);
          getPlayer().stop();
          setProgressValue(0);
          setPlayButtonDisabled(false);
          setStopButtonDisabled(true);
          setPauseButtonDisabled(true);
          setResumeButtonDisabled(true);
      }
      animationId.current = requestAnimationFrame(audioLoop);
  }

  useEffect(() => {
      if (isPlaying) {
          animationId.current = requestAnimationFrame(audioLoop);
      } else {
          cancelAnimationFrame(animationId.current);
      }
      return () => {
          cancelAnimationFrame(animationId.current);
      }
  }, [isPlaying, pitchValue]);




  const handlePlayClick = () => {
    if (getCurrentSong()) {
      setIsPlaying(true); 
      getPlayer().startPlay();
      setPlayButtonDisabled(true);
      setStopButtonDisabled(false);
      setPauseButtonDisabled(false);
      setResumeButtonDisabled(true);
    }
  }

  const handleStopClick = () => {
    setIsPlaying(false);
    getPlayer().stop();
    setPlayButtonDisabled(false);
    setStopButtonDisabled(true);
    setPauseButtonDisabled(true);
    setResumeButtonDisabled(true);
  }

  const handlePauseClick = () => {
    setIsPlaying(false);
    getPlayer().pause();
    setPlayButtonDisabled(true);
    setStopButtonDisabled(false);
    setPauseButtonDisabled(true);
    setResumeButtonDisabled(false);
  }

  const handleResumeClick = () => {
    setIsPlaying(true);
    getPlayer().startPlay();
    setPlayButtonDisabled(true);
    setStopButtonDisabled(false);
    setPauseButtonDisabled(false);
    setResumeButtonDisabled(true);
  }

  function handleProgressChange(event) {
    setProgressValue(event.target.value);
    getPlayer().setTime(event.target.value);
    processAudio();
  }

  const handlePitchChange = (event) => {
    setPitchValue(parseInt(event.target.value));
    getPlayer().pitch = parseInt(event.target.value) ;
    processAudio();
  }

  const handleSpeedChange = (event) => {  
    setSpeedValue(parseFloat(event.target.value));
    getPlayer().playbackSpeed = parseFloat(event.target.value);
    processAudio();
  }
  
  return (<>  
    <div className='buttons'>
      <button id="play" className='btn' onClick={handlePlayClick} disabled={playButtonDisabled}>Play</button>
      <button id="stop" className='btn' onClick={handleStopClick} disabled={stopButtonDisabled}>Stop</button>
      <button id="pause" className='btn' onClick={handlePauseClick} disabled={pauseButtonDisabled}>Pause</button>
      <button id="resume" className='btn' onClick={handleResumeClick} disabled={resumeButtonDisabled}>Resume</button>
    </div>
    <div className='sliders'>
        <div className='range__slider'>
          <span>Progress:</span>
              <input type="range"
                id='slider'
                min={0}
                max={getCurrentSong() ? getCurrentSong().getEnd() / 1000 : 0}
                value={progressValue ? progressValue : 0}
                onChange={handleProgressChange}
              />
          <span>{getPlayer().getTime(true)}</span>
        </div>
        <div className='range__slider'>
          <span>Pitch:</span>
              <input
                type="range"
                min={-12}
                max={12}
                value={pitchValue}
                onChange={handlePitchChange}
              />
          <span>{pitchValue}</span>
        </div> 
        <div className='range__slider'>
          <span>Speed:</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={speedValue}
                onChange={handleSpeedChange}
              />
          <span>{speedValue}</span>
          </div>
    </div>
    </>
  );
}




export default MusicPlayer;
