import './App.css';
import { Routes, Route} from "react-router-dom";
import PianoKeyboard from './PianoKeyboard';
import AudioPlayer from './AudioPlayer';

function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<PianoKeyboard />} />
    </Routes>
  </>
  );
}

export default App;