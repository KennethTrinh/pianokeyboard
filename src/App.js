import './App.css';
import { Routes, Route} from "react-router-dom";
import PianoKeyboard from './PianoKeyboard';

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