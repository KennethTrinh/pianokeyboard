import React, { useState, useRef, useEffect } from 'react';
import { getPlayer, getPlayerState, getCurrentSong } from "./js/player/Player.js"

const MusicPlayer = (props) => {
  const [noteSequence, setNoteSequence] = useState(null);
  const [playButtonDisabled, setPlayButtonDisabled] = useState(true);
  const [stopButtonDisabled, setStopButtonDisabled] = useState(true);
  const [pauseButtonDisabled, setPauseButtonDisabled] = useState(true);
  const [resumeButtonDisabled, setResumeButtonDisabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const DURATION_WINDOW = 3
  let animationId = null;

  const [sliderValue, setSliderValue] = useState(0);
  const [pitchValue, setPitchValue] = useState(0);


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
      if (ns)
        setPlayButtonDisabled(false);
    }
    reader.readAsDataURL(f);
  }
  }, [props.currentSongURL]);



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
        const startIndex = Math.max(0, currentNoteIndex - 100); 
        const endIndex = Math.min(noteSequence.length, currentNoteIndex + 100);
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
    const canvas = document.getElementById("visualizationCanvas");
    const ctx = canvas.getContext("2d");
    const currentTime = getPlayer().getTime();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3ac8da";
    notes = notes.filter(note => note.pitch + pitchValue >= 21 && note.pitch + pitchValue <= 108);
    notes.forEach(note => {
        const { startWidth, endWidth } = findKeyPosition(note.pitch);
        const startY = canvas.height - (note.startTime - currentTime) / (DURATION_WINDOW) * canvas.height;
        const endY = canvas.height - (note.endTime - currentTime) / (DURATION_WINDOW) * canvas.height;
        if (note.startTime <= currentTime + DURATION_WINDOW) {
            ctx.fillRect(startWidth, startY, endWidth - startWidth, endY - startY);
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



  const computeCurrentTime = (timestamp) => {
      setSliderValue(getPlayer().getTime());
      processAudio();
      if (getPlayer().getTime() > getCurrentSong().getEnd()/ 1000) {
          setIsPlaying(false);
          getPlayer().stop();
          setSliderValue(0);
          setPlayButtonDisabled(false);
          setStopButtonDisabled(true);
          setPauseButtonDisabled(true);
          setResumeButtonDisabled(true);
      }
      animationId = requestAnimationFrame(computeCurrentTime);
  }

  useEffect(() => {
      if (isPlaying) {
          animationId = requestAnimationFrame(computeCurrentTime);
      } else {
          cancelAnimationFrame(animationId);
      }
      return () => {
          cancelAnimationFrame(animationId);
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

  function handleSliderChange(event) {
    setSliderValue(event.target.value);
    getPlayer().setTime(event.target.value);
    processAudio();
  }

  const handleChange = (event) => {
    setPitchValue(parseInt(event.target.value));
    getPlayer().pitch = parseInt(event.target.value) ;
    processAudio();
  }
  
  function convertObjectsToString(objects) {
    return objects.map(obj => JSON.stringify(obj)).join(", ");
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
                value={sliderValue ? sliderValue : 0}
                onChange={handleSliderChange}
              />
          <span>{getPlayer().getTime() ? getPlayer().getTime().toFixed(2) : '0'}</span>
        </div>

        <div className='range__slider'>
          <span>Pitch:</span>
              <input
                type="range"
                min={-12}
                max={12}
                value={pitchValue}
                onChange={handleChange}
              />
          <span>{pitchValue}</span>
        </div> 
    </div>

    </>
  );
}




export default MusicPlayer;
