import './App.css';
import LandingPage from './pages/LandingPage';
import { BrowserRouter, Routes, Router } from "react-router-dom";
import VideoMeetComponent from './components/Video/VideoMeetComponent';

// add path="/:url" from video component
function App() {

  return (
    <>
    {/* <LandingPage/> */}
    <VideoMeetComponent/>
    </>
  )
}

export default App
