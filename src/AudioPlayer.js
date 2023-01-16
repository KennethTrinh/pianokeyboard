import React, { useState, useRef, useEffect } from 'react';
import * as mm from '@magenta/music/esm/core.js';


const AudioPlayer = () => {
  const [noteSequence, setNoteSequence] = useState(null);
  const [player, setPlayer] = useState(null);
  const playStateRef = useRef(null);
  const sliderRef = useRef(null);
  const currentTimeRef = useRef(null);
  const [playButtonDisabled, setPlayButtonDisabled] = useState(false);
  const [stopButtonDisabled, setStopButtonDisabled] = useState(true);
  const [pauseButtonDisabled, setPauseButtonDisabled] = useState(true);
  const [resumeButtonDisabled, setResumeButtonDisabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [noteObjects, setNoteObjects] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  let intervalId = null;
    

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    const fileUrl = URL.createObjectURL(file);
    const ns = await mm.urlToNoteSequence(fileUrl);
    setNoteSequence(ns);
  }


  useEffect(() => {
    if (noteSequence) {
      setNoteObjects(writeNoteSeqs([noteSequence])[0]);
      setPlayer( new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus', undefined, undefined, undefined,
          {
          run: (note) => {
            // console.log(`Pitch: ${note.pitch}, Velocity: ${note.velocity}, StartTime: ${note.startTime}, EndTime: ${note.endTime}`);
            sliderRef.current.value = currentTimeRef.current.textContent = note.startTime.toFixed(1);
            // setCurrentTime(note.startTime);
          },
          stop: () => {} 
        }))

    }
  }, [noteSequence]);

  // useEffect(() => {
  //   if (noteSequence && player) {
  //       const currentNoteObjectIndex = noteObjects.length * currentTime / noteSequence.totalTime.toFixed(1)  //noteObjects[Math.floor(currentTime) ];
  //       const currentNoteObject = noteObjects[ Math.floor(currentNoteObjectIndex) ];
  //       console.log(currentNoteObjectIndex);
  //   }
  // }, [currentTime])

  // useEffect(() => {
  //   if (isPlaying) {
  //     intervalId = setInterval(() => {
  //     setCurrentTime((prevTime) => (prevTime + 0.1));
  //     console.log(currentTime);
  //     }, 100);
  //   } else {
  //     clearInterval(intervalId);
  //   }
  //     return () => clearInterval(intervalId);
  //   }, [isPlaying]);



  const handlePlayClick = () => {
    setIsPlaying(true); 
    player.start(noteSequence);
    sliderRef.current.max = noteSequence.totalTime.toFixed(1);
    sliderRef.current.value = '0';
    playStateRef.current.textContent = player.getPlayState();
    setPlayButtonDisabled(true);
    setStopButtonDisabled(false);
    setPauseButtonDisabled(false);
    setResumeButtonDisabled(true);
  }

  const handleStopClick = () => {
    setIsPlaying(false);
    player.stop();
    playStateRef.current.textContent = player.getPlayState();
    setPlayButtonDisabled(false);
    setStopButtonDisabled(true);
    setPauseButtonDisabled(true);
    setResumeButtonDisabled(true);
  }

  const handlePauseClick = () => {
    setIsPlaying(false);
    clearInterval();
    player.pause();
    playStateRef.current.textContent = player.getPlayState();
    setPlayButtonDisabled(true);
    setStopButtonDisabled(false);
    setPauseButtonDisabled(true);
    setResumeButtonDisabled(false);
  }

  const handleResumeClick = () => {
    setIsPlaying(true);
    player.resume();
    playStateRef.current.textContent = player.getPlayState();
    setPlayButtonDisabled(true);
    setStopButtonDisabled(false);
    setPauseButtonDisabled(false);
    setResumeButtonDisabled(true);
  }

  const handleSliderChange = () => {
    const t = parseFloat(sliderRef.current.value);
    currentTimeRef.current.textContent = t.toFixed(1);
    const playing = (player.getPlayState() === 'started');
    if (playing) {
      player.pause();
    }
    player.seekTo(t);
    if (playing) {
      player.resume();
    }
  }

  function convertObjectsToString(objects) {
    return objects[0].map(obj => JSON.stringify(obj)).join(", ");
  }
  const writeNoteSeqs = (seqs, useSoundFontPlayer = false, writeVelocity = false) => {
    return seqs.map(seq => {
      const isQuantized = mm.sequences.isQuantizedSequence(seq);
      return seq.notes.map(n => {
          let note = {
            pitch: n.pitch,
            startTime: isQuantized ? n.quantizedStartStep : n.startTime.toPrecision(3)
          };
          if (n.quantizedEndStep || n.endTime) {
            note.endTime = isQuantized ? n.quantizedEndStep : n.endTime.toPrecision(3);
          }
          if (n.velocity) {
            note.velocity = n.velocity;
          }
          return note;
        })
      
    });
  }


  return (
    <div>
      <input type="file" accept=".mid" onChange={handleFileChange} />
      <button id="play" onClick={handlePlayClick} disabled={playButtonDisabled}>Play</button>
      <button id="stop" onClick={handleStopClick} disabled={stopButtonDisabled}>Stop</button>
      <button id="pause" onClick={handlePauseClick} disabled={pauseButtonDisabled}>Pause</button>
      <button id="resume" onClick={handleResumeClick} disabled={resumeButtonDisabled}>Resume</button>
      <div>
        <span id="playState" ref={playStateRef}></span>
        <input id="slider" type="range" ref={sliderRef} min={0} disabled={stopButtonDisabled} onChange={handleSliderChange} />
        <span id="currentTime" ref={currentTimeRef}>0</span>
      </div>
      <div>Current Time: {currentTime}</div>
        <div>
        <span> Notes: {noteSequence? convertObjectsToString(writeNoteSeqs([noteSequence])) : 0}</span>
      </div>
    </div>
  );
}




export default AudioPlayer;
