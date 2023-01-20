import React, { useState, useRef, useEffect } from 'react';
import * as mm from '@magenta/music/esm/core.js';


const AudioPlayer = (props) => {
  const [noteSequence, setNoteSequence] = useState(null);
  const [player, setPlayer] = useState(null);
  const playStateRef = useRef(null);
  const sliderRef = useRef(null);
  const discreteCurrentTimeRef = useRef(null);
  const currentTimeRef = useRef({current: {textContent: '0'} });
  const [playButtonDisabled, setPlayButtonDisabled] = useState(true);
  const [stopButtonDisabled, setStopButtonDisabled] = useState(true);
  const [pauseButtonDisabled, setPauseButtonDisabled] = useState(true);
  const [resumeButtonDisabled, setResumeButtonDisabled] = useState(true);
  const [noteObjects, setNoteObjects] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const sliderDown = useRef(false);
  const sliderScrollValue = useRef('0');
  const RETRIES = 8;
  const [didSeekBack, setDidSeekBack] = useState(RETRIES);
  const DURATION_WINDOW = 3
  let animationId = null;
  let lastTimestamp = null;
  let milliseconds_increment = null;

  // const handleFileChange = async (event) => {
  //   if (noteSequence) {
  //     setIsPlaying(false);
  //     player.stop();
  //     playStateRef.current.textContent = player.getPlayState();
  //     setPlayButtonDisabled(true);
  //     setStopButtonDisabled(true);
  //     setPauseButtonDisabled(true);
  //     setResumeButtonDisabled(true);
  //     sliderRef.current.value = '0';
  //     currentTimeRef.current.textContent = '0';
  //     cancelAnimationFrame(animationId);
  //     lastTimestamp = null;
  //     await setTimeout( () => {
  //       discreteCurrentTimeRef.current.textContent = '0';
  //     }, 100);
  //   }
  //   const file = event.target.files[0];
  //   const fileUrl = URL.createObjectURL(file);
  //   console.log(fileUrl);
  //   const ns = await mm.urlToNoteSequence(fileUrl);
  //   setNoteSequence(ns);
  // }

  useEffect( () => {
    async function loadNoteSequence() {
    if (noteSequence) {
      setIsPlaying(false);
      player.stop();
      playStateRef.current.textContent = player.getPlayState();
      setPlayButtonDisabled(true);
      setStopButtonDisabled(true);
      setPauseButtonDisabled(true);
      setResumeButtonDisabled(true);
      sliderRef.current.value = '0';
      currentTimeRef.current.textContent = '0';
      cancelAnimationFrame(animationId);
      lastTimestamp = null;
      await setTimeout( () => {
        discreteCurrentTimeRef.current.textContent = '0';
      }, 100);
    }
    if (props.currentSongURL) {
      const ns = await mm.urlToNoteSequence(props.currentSongURL);
      setNoteSequence(ns);
    }
  }
  loadNoteSequence();
  }, [props.currentSongURL]);


  useEffect(() => {
    if (noteSequence) {
      setNoteObjects(writeNoteSeqs(noteSequence).sort((a, b) => a.startTime - b.startTime));
      setPlayer( new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus', undefined, undefined, undefined,
          {
          run: (note) => {
            // console.log(`Pitch: ${note.pitch}, Velocity: ${note.velocity}, StartTime: ${note.startTime}, EndTime: ${note.endTime}`);
            sliderRef.current.value = sliderDown.current ? sliderScrollValue.current : note.startTime.toFixed(5);
            discreteCurrentTimeRef.current.textContent = note.startTime.toFixed(5);
          },
          stop: () => { 
            setIsPlaying(false);
            setPlayButtonDisabled(false);
            setStopButtonDisabled(true);
            setPauseButtonDisabled(true);
            setResumeButtonDisabled(true);
            cancelAnimationFrame(animationId);
            lastTimestamp = null;
            setTimeout( () => {
              discreteCurrentTimeRef.current.textContent = '0';
              currentTimeRef.current.textContent = '0';
              }, 100)
            } 
        }))
      setPlayButtonDisabled(false);
    }
  }, [noteSequence]);

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
    return -1;
  }

  const processAudio = () => {
    if (noteSequence && player) {
        const currentTime = parseFloat(discreteCurrentTimeRef.current.textContent);
        const currentNoteIndex = binarySearch(noteObjects, currentTime);
        const startIndex = Math.max(0, currentNoteIndex - 100); 
        const endIndex = Math.min(noteObjects.length, currentNoteIndex + 100);
        const buffer = noteObjects.slice(startIndex, endIndex);
        const currentNotes = currentNoteIndex === -1 ? [] :  
                  buffer.filter(note => {
                  return currentTime >= parseFloat(note.startTime) && currentTime < parseFloat(note.endTime);
              });
        drawCanvas(buffer);
        props.render(currentNotes.map( note => note.pitch)); //calls setCurrentNotes in PianoKeyboard.js
        // console.log(currentNotes);
        // console.log(currentTime);
        // console.log(currentTime, currentNotes, currentNoteObjectIndex);
        
    }
  }
  const drawCanvas = (notes) => {
    const canvas = document.getElementById("visualizationCanvas");
    const ctx = canvas.getContext("2d");
    const currentTime = parseFloat(currentTimeRef.current.textContent);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3ac8da";
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
        if (count === midiNumber) {
            return {
                startWidth: parseFloat(key.style.left) * keyboardWidth / 100,
                endWidth: (parseFloat(key.style.left) + parseFloat(key.style.width)) * keyboardWidth / 100
            };
        }
        count++;
    }
  }



  const computeCurrentTime = (timestamp) => {
      if (lastTimestamp)  {
          milliseconds_increment = (timestamp - lastTimestamp) / 1000;
          processAudio();
          const currentTime = parseFloat(currentTimeRef.current.textContent);
          const discreteTime = parseFloat(discreteCurrentTimeRef.current.textContent);
          // initially, I tried:  Math.abs( currentTime - discreteTime ) > 5)
          // but discreteCurrentTimeRef.current.textContent = note.startTime.toFixed(5); has a latency period after the seek
          if (didSeekBack < RETRIES)  {   
            currentTimeRef.current.textContent = (discreteTime + milliseconds_increment).toFixed(5);
            setDidSeekBack( (prev) =>  (prev < RETRIES) ? (prev + 1) % (RETRIES + 1): prev );
          } else { 
            currentTimeRef.current.textContent = Math.max(      //discrete time is the lower bound
              (currentTime + milliseconds_increment),
              (discreteTime + milliseconds_increment)
            ).toFixed(5);
          }
      }
        
      lastTimestamp = timestamp;
      animationId = requestAnimationFrame(computeCurrentTime);
  }

  useEffect(() => {
      if (isPlaying) {
          animationId = requestAnimationFrame(computeCurrentTime);
      } else {
          cancelAnimationFrame(animationId);
          lastTimestamp = null;
      }
      return () => {
          cancelAnimationFrame(animationId);
          lastTimestamp = null;
      }
  }, [isPlaying, didSeekBack]);

    //make sure currentTimeRef is updated when props.width changes
    useEffect(() => {
      currentTimeRef.current.textContent = parseFloat(
                    discreteCurrentTimeRef.current.textContent);

    }, [props.width]);



  const handlePlayClick = () => {
    player.loadSamples(noteSequence).then(() => {
      player.start(noteSequence);
      setIsPlaying(true); 
      sliderRef.current.max = noteSequence.totalTime.toFixed(1);
      sliderRef.current.value = '0';
      currentTimeRef.current.textContent = '0';
      playStateRef.current.textContent = 'started';
      setPlayButtonDisabled(true);
      setStopButtonDisabled(false);
      setPauseButtonDisabled(false);
      setResumeButtonDisabled(true);
    });
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


  
  const floatsEqual = (a, b, epsilon = 0.0001) => {
    return Math.abs(a - b) < epsilon;
  }


  const handleSliderMouseUp = () => {
    const t = parseFloat(sliderRef.current.value);

    if (t < parseFloat(discreteCurrentTimeRef.current.textContent)) {
      discreteCurrentTimeRef.current.textContent = t.toFixed(5);
      currentTimeRef.current.textContent = t.toFixed(5);
      setDidSeekBack(0);
    } else{
      discreteCurrentTimeRef.current.textContent = t.toFixed(5);
      currentTimeRef.current.textContent = t.toFixed(5);
    }

    if ( !floatsEqual(t, 0) && !floatsEqual(t, noteSequence.totalTime.toFixed(5)) ){ 
      const playing = (player.getPlayState() === 'started');
      if (playing) {
        player.pause();
      }
      player.seekTo(t);
      if (playing) {
        player.resume();
      }
    } else {
      // TODO: handle start and end of song

    }
    sliderDown.current = false;
    processAudio();
  }
  //come back later to handle start and end of song
  const handleMouseChange = () => {
    const scrollValue = parseFloat(sliderRef.current.value);
    sliderScrollValue.current = scrollValue < noteSequence.totalTime.toFixed(5) && scrollValue > 0 ? 
                                sliderRef.current.value : currentTimeRef.current.textContent;
  };


  function convertObjectsToString(objects) {
    return objects.map(obj => JSON.stringify(obj)).join(", ");
  }
  const writeNoteSeqs = (seqs, useSoundFontPlayer = false, writeVelocity = false) => {
    
    const isQuantized = mm.sequences.isQuantizedSequence(seqs);
    return seqs.notes.map(n => {
        let note = {
          pitch: n.pitch,
          startTime: isQuantized ? n.quantizedStartStep : parseFloat(n.startTime.toFixed(5))
        };
        if (n.quantizedEndStep || n.endTime) {
          note.endTime = isQuantized ? n.quantizedEndStep : parseFloat(n.endTime.toFixed(5));
        }
        if (n.velocity) {
          note.velocity = n.velocity;
        }
        return note;
      })
      
  }


  return (
    <div>
      {/* <input type="file" accept=".mid" onChange={handleFileChange} /> */}
      <button id="play" onClick={handlePlayClick} disabled={playButtonDisabled}>Play</button>
      <button id="stop" onClick={handleStopClick} disabled={stopButtonDisabled}>Stop</button>
      <button id="pause" onClick={handlePauseClick} disabled={pauseButtonDisabled}>Pause</button>
      <button id="resume" onClick={handleResumeClick} disabled={resumeButtonDisabled}>Resume</button>
      <div>
        <span id="playState" ref={playStateRef}></span>
        <input id="slider" type="range" ref={sliderRef} min={0} disabled={stopButtonDisabled} 
          onMouseDown={() =>{sliderDown.current = true;}} onMouseUp={handleSliderMouseUp} onChange={handleMouseChange} />
      </div>
      <div>Current Time: <span ref={currentTimeRef}>0</span></div>
      <div>Discrete Current Time: <span id="discreteCurrentTime" ref={discreteCurrentTimeRef}>0</span> </div>
        <div>
        {/* <span> Notes: {noteSequence? convertObjectsToString(writeNoteSeqs(noteSequence)) : 'No notes loaded'}</span> */}
      </div>    
    </div>
  );
}




export default AudioPlayer;
