import { useEffect, useState } from "react";
import "./App.css";
import "./css/style.css";
import manifest from "./music/manifest";

const Playlist = (props) => {
  const [playlist, setPlaylist] = useState([]);
  const { currentSong, setCurrentSong, currentSongURL, setCurrentSongURL } =
    props;

  useEffect(() => {
    const initializePlaylist = async () => {
      const initialPlaylist = await Promise.all(
        manifest.map(async ({ name, file }) => {
          const response = await fetch(file);
          const blob = await response.blob();
          return { name, url: blob };
        }),
      );
      setPlaylist(initialPlaylist);
      setCurrentSong(initialPlaylist[0].name);
      setCurrentSongURL(initialPlaylist[0].url);
    };
    initializePlaylist();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const fileUrl = file; //URL.createObjectURL(file);
    const newSong = { name: file.name, url: fileUrl };
    setPlaylist([...playlist, newSong]);
  };

  const addSong = (song) => {
    setPlaylist([...playlist, song]);
  };

  const next = () => {
    let nextIndex =
      playlist.findIndex(
        (song) => song.name === currentSong && song.url === currentSongURL,
      ) + 1;
    if (nextIndex === playlist.length) {
      nextIndex = 0;
    }
    setCurrentSong(playlist[nextIndex].name);
    setCurrentSongURL(playlist[nextIndex].url);
  };

  const prev = () => {
    let prevIndex =
      playlist.findIndex(
        (song) => song.name === currentSong && song.url === currentSongURL,
      ) - 1;
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
    <div style={{ textAlign: "center" }}>
      <h1
        style={{
          fontSize: "2em",
          fontWeight: "bold",
          marginTop: "20px",
          color: "#ff69b4",
        }}
      >
        My Hopeless Romantic Playlist
      </h1>
      <ul style={{ listStyleType: "none" }}>
        {playlist.map((song) => (
          <li
            key={song.name}
            onClick={() => handleClick(song)}
            className="song-item"
          >
            {song.name}
          </li>
        ))}
      </ul>
      <input type="file" accept=".mid" onChange={handleFileChange} />
      <button className="btn" onClick={prev}>
        Previous
      </button>
      <button className="btn" onClick={next}>
        Next
      </button>
      <p>Current Song: {currentSong}</p>
    </div>
  );
};

export default Playlist;
