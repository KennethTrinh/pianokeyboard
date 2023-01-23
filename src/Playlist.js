import React, { useState, useEffect } from 'react';
import Etude from './music/Etude op25 n11 \'\'Winter Wind\'\'.mid';
import MiaSebastian from './music/Mia & Sebastian’s Theme - La La Land OST (Justin Hurwitz).MID';
import './css/style.css';

const Playlist = (props) => {
  const [playlist, setPlaylist] = useState([]);
  const {currentSong, setCurrentSong, currentSongURL, setCurrentSongURL} = props;

  useEffect(() => {
    const initializePlaylist = async () => {
        const promises = [Etude, MiaSebastian].map(async (song) => {
            const response = await fetch(song);
            const blob = await response.blob();
            return blob;//URL.createObjectURL(blob);
        });
        const urls = await Promise.all(promises);
        const initialPlaylist = [        
            {name: 'Etude op25 n11 \'Winter Wind\'', url: urls[0]},
            {name: 'Mia & Sebastian’s Theme - La La Land OST (Justin Hurwitz)', url: urls[1]}
        ]
        setPlaylist(initialPlaylist);
        setCurrentSong(initialPlaylist[0].name);
        setCurrentSongURL(initialPlaylist[0].url);
    }
    initializePlaylist();

  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const fileUrl = file;//URL.createObjectURL(file);
    const newSong = { name: file.name, url: fileUrl };
    setPlaylist([...playlist, newSong]);
  };

  const addSong = (song) => {
    setPlaylist([...playlist, song]);
  };

  const next = () => {
    let nextIndex = playlist.findIndex( song => song.name === currentSong && song.url === currentSongURL) + 1;
    if (nextIndex === playlist.length) {
      nextIndex = 0;
    }
    setCurrentSong(playlist[nextIndex].name);
    setCurrentSongURL(playlist[nextIndex].url);
  };

  const prev = () => {
    let prevIndex =playlist.findIndex( song => song.name === currentSong && song.url === currentSongURL) - 1;
    if (prevIndex < 0) {
      prevIndex = playlist.length - 1;
    }
    setCurrentSong(playlist[prevIndex].name);
    setCurrentSongURL(playlist[prevIndex].url);
  };

  const handleClick = (song) => {
    setCurrentSong(song.name);
    setCurrentSongURL(song.url);
  };

  return (
    <div style={{textAlign: "center"}}>
    <h1 style={{
        fontSize: "2em",
        fontWeight: "bold",
        textDecoration: "underline",
        marginTop: "20px",
        color: "#ff69b4"
      }}>My Hopeless Romantic Playlist</h1>
      <ul style={{ listStyleType: "none" }}>
        {playlist.map((song) => (
          <li key={song.name} onClick={() => handleClick(song)} className="song-item">
            {song.name}
          </li>
        ))}
      </ul>
      <input type="file" accept=".mid" onChange={handleFileChange} />
      <button onClick={prev}>Previous</button>
      <button onClick={next}>Next</button>
      <p>Current Song: {currentSong}</p>
    </div>
  );

};

export default Playlist;
