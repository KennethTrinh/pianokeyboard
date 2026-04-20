import { memo, useEffect, useState } from "react";
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

  const handleClick = (song) => {
    setCurrentSong(song.name);
    setCurrentSongURL(song.url);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div className="playlist-container">
        <p className="playlist-title">My Hopeless Romantic Playlist</p>
        <p className="playlist-hint">Click a song to play</p>
        <ul className="playlist-ul">
          {playlist.map((song) => (
            <li
              key={song.name}
              onClick={() => handleClick(song)}
              className={`song-item${song.name === currentSong ? " active" : ""}`}
            >
              <span>{song.name === currentSong ? "🎵" : "🎹"}</span>
              {song.name}
            </li>
          ))}
        </ul>
        <input type="file" accept=".mid" onChange={handleFileChange} />
      </div>
    </div>
  );
};

export default memo(Playlist);
