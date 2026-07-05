import React, { useState, useRef, useEffect } from "react";

const server_url = "http://localhost:8000";
let connections = {};
// activating stun server....
const PeerConfigConnections = {
  iceServer: [{ urls: "stun:stun.l.google.com:19302" }],
};

const VideoMeetComponent = () => {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();
  const [VideoAvailable, SetVideoAvailable] = useState(false);
  const [AudioAvailable, SetAudioAvailable] = useState(false);
  const [Video, SetVideo] = useState();
  const [Audio, SetAudio] = useState();
  const [ScreenSharing, SetScreenSharing] = useState();
  const [ShowModal, SetShowModal] = useState();
  const [ScreenAvailable, SetScreenAvailable] = useState();
  const [Messages, SetMessages] = useState([]);
  const [ToastMessage, SetToastMessage] = useState("");
  const [NewMessages, SetNewMessages] = useState(0);
  const [AskForUsername, SetAskForUsername] = useState(true);
  const [Username, SetUsername] = useState("");
  const videoRef = useRef([]);
  const [Videos, SetVideos] = useState([]);

  const GetUserPermissions = async () => {
    try {
      let hasVideo = false;
      let hasAudio = false;

      const video_permission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (video_permission) {
        hasVideo = true;
        SetVideoAvailable(true);

        // Stop track immediately so we can request combined stream later
        video_permission.getTracks().forEach((track) => track.stop());
      } else {
        SetVideoAvailable(false);
      }

      const audio_permission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audio_permission) {
        hasAudio = true;
        SetAudioAvailable(true);

        // Stop track immediately
        audio_permission.getTracks().forEach((track) => track.stop());
      } else {
        SetAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        SetScreenAvailable(true);
      } else {
        SetScreenAvailable(false);
      }

      //   if (VideoAvailable || AudioAvailable) {
      //     const userMediaStream = await navigator.mediaDevices.getUserMedia({
      //       //   video: VideoAvailable,
      //       //   audio: AudioAvailable,
      //     });
      if (hasVideo || hasAudio) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: hasVideo,
          audio: hasAudio,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {}
  };

  const GetUserMediaSuccess = (stream) => {

  };

  const GetUserMedia = () => {
    if ((Video && VideoAvailable) || (Audio && AudioAvailable)) {
      navigator.mediaDevices
        .GetUserMedia({ video: Video, audio: Audio })
        .then(GetUserMediaSuccess)
        // .then(() => {})
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        } catch (error) {

        }
    }
  };

  useEffect(() => {
    if (Video !== undefined && Audio !== undefined){
        GetUserMedia();
    }
  }, [Audio, Video]);

  useEffect(() => {
    GetUserPermissions();
  }, []);

  const GetMedia = () => {
    SetVideo(VideoAvailable);
    SetAudio(AudioAvailable);
  };

  const connect = () => {
    SetAskForUsername(false);
    GetMedia();
  };

  return (
    <>
      <div>
        {AskForUsername === true ? (
          <>
            <div>
              <h2>Enter into Lobby</h2>
              <form action="">
                <label htmlFor="username">Enter Username</label>
                <input
                  type="text"
                  name="username"
                  value={Username}
                  onChange={(e) => SetUsername(e.target.value)}
                />
                <button type="submit" onClick={connect}>Connect</button>
              </form>
              <div>
                <video ref={localVideoRef} autoPlay muted />
              </div>
            </div>
          </>
        ) : (
          <>
            <div></div>
          </>
        )}
      </div>
    </>
  );
};

export default VideoMeetComponent;
