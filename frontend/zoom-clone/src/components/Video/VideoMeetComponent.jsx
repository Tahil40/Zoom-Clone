import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";

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
  const [Video, SetVideo] = useState([]);
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

  const GotMessageFromServer = () => {

  };
  
  const AddMessage = () => {

  };

  const ConnectToSocketServer = () => {
    socketRef.current = io.connect(server_url, {secure: false});
    socketRef.current.on("signal", GotMessageFromServer);
    socketRef.current.on("connect", () => {
      
      socketRef.current.emit("join-call", window.location.href);
      
      socketIdRef.current = socketRef.current.id;
      
      socketRef.current.on("chat-message", AddMessage);
      
      socketRef.current.on("user-left", (id) => {
        SetVideo((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(PeerConfigConnections);
          connections[socketListId].onicecandidate = (event) => {
            if(event.candidate != null){
              socketRef.current.emit("signal", socketListId, JSON.stringify({"ice": event.candidate}));
            }
          };
          connections[socketListId].onaddstream = (event) => {
            let video_exists = videoRef.current.find((video) => video.socketId === socketListId);

            if(video_exists){
              SetVideo((videos) => {
                const updatedVideos = videos.map((video) => {
                  video.socketId === socketListId ? {...video, stream: event.stream} : video
                });
                videoRef.current = updatedVideos;
                return updatedVideos; 
              });
            } else {
              let new_video = {
                socketId: socketListId,
                stream: event.stream,
                autoPlay: true, 
                playsinline: true,  
              };

              SetVideo((videos) => {
                const updated_videos = [...videos, new_video];
                videoRef.current = updated_videos;
                return updated_videos;
              });
            }
          };
          if(window.localStream !== undefined && window.localStream !== null){
            connections[socketListId].addStream(window.localStream);
          } else {

          }
        });

        if(id===socketIdRef.current){
          for(let id2 in connections){
            if(id2===socketIdRef.current) continue
            try{
              connections[id2].addStream(window.localStream);
            } catch (error) {}
            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", id2, JSON.stringify({"session_description": connections[id2].localDescription}));
              }).catch((error) => console.log(error));
            });
          }
        };
      });
    });
  };

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
