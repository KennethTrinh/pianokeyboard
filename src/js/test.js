import { Render } from "./Rendering/Render.js"
import { UI } from "./ui/UI.js"
import { InputListeners } from "./InputListeners.js"
import { getPlayer, getPlayerState, getCurrentSong } from "./player/Player.js"
import { loadJson } from "./Util.js"
import { FileLoader } from "./player/FileLoader.js"
import { SongUI } from "./ui/SongUI.js"



let songUI = new SongUI();

function newSongCallback() {
    songUI.newSongCallback(getCurrentSong());
}

getPlayer().newSongCallbacks.push(newSongCallback);


const loadButton = document.getElementById("load-button");
loadButton.addEventListener("change", function(){
    // access the selected file
    const file = this.files[0];
    let reader = new FileReader()
    let fileName = file.name
    reader.onload = function (theFile) {
        getPlayer().loadSong(reader.result, fileName)
    }.bind(this)
    reader.readAsDataURL(file);
});

const playButton = document.getElementById("play-button");
playButton.addEventListener("click", function(){
    // console.log(getPlayer().song);
    // console.log(getCurrentSong());
    // getPlayer().setSong(getCurrentSong());
    // console.log(getCurrentSong().measureLines);
    if (getPlayer().song) {
        // console.log(getPlayer().song)
        getPlayer().startPlay();
    }
}
);

const pauseButton = document.getElementById("pause-button");
pauseButton.addEventListener("click", function(){
    getPlayer().pause()
}
);


const progressButton = document.getElementById("progress-button");
progressButton.addEventListener("click", function(){
    // console.log(getPlayer().progress);
    // console.log(getPlayer().audioPlayer.audioNotes);
    // console.log(getPlayer().inputActiveNotes);

    // console.log(getPlayer().song.getNoteSequence());
    // console.log(getPlayer().getCurrentTrackInstrument(1));
    
    // console.log(getPlayer().lastTime);
    const currentTime = getPlayer().lastTime
    console.log(getPlayer().song.getNotes(currentTime, currentTime + 3));
}
);
// function updateProgress() {
//     let progress = getPlayer().progress;
//     console.log(progress);
//     // document.getElementById("song-progress").innerHTML = progress;
//     requestAnimationFrame(updateProgress);
//   }

// requestAnimationFrame(updateProgress);  



