import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import "./VideoMeetComponent.css";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';


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
  const [ScreenSharing, SetScreenSharing] = useState(false);
  const [ShowModal, SetShowModal] = useState();
  const [ScreenAvailable, SetScreenAvailable] = useState();
  const [Messages, SetMessages] = useState([]);
  const [ToastMessage, SetToastMessage] = useState("");
  const [NewMessages, SetNewMessages] = useState(0);
  const [AskForUsername, SetAskForUsername] = useState(true);
  const [Username, SetUsername] = useState("");
  const videoRef = useRef([]);
  const [Videos, SetVideos] = useState([]);

  // trigger this function when user clicks turn on or off video....
  const handleVideo = () => {
    SetVideo(!Video);
  };

  // trigger this function when user clicks turn on or off audio....
  const handleAudio = () => {
    SetAudio(!Audio);
  };

  // trigger this function when user clicks turn on or off screen sharing....
  const handleScreen = () => {
    SetScreenSharing(!ScreenSharing);
  };

  // trigger this function when user clicks to end call....
  const handleEndCall = () => {
    try {
      // stop user's video and audio stream when user click end call....
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }
    // naviagte the user to home page after stoping user's audio and video stream....
    window.location.href = "/";
  };

  // trigger this function when user open it chat....
  const openChat = () => {
    SetShowModal(true);
    SetNewMessages(0);
  };

  // trigger this function when user close it chat....
  const closeChat = () => {
    SetShowModal(false);
  };

  // trigger this function when the value of html input tag changes....
  const handleMessage = (e) => {
    // load the html input tag's value in Messages state....
    SetMessages(e.target.value);
  };

  // trigger this function when user click send message....
  const addMessage = (data, sender, socketIdSender) => {
    // add the new message into the state....
    SetMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    // checks if the message send by the user goes to the another person except himself if yes then update state by adding 1 into it....
    if (socketIdSender !== socketIdRef.current) {
      SetNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  // send the message to the backend and WebSockets....
  let sendMessage = () => {
    socketRef.current.emit("chat-message", Messages, Username);
    SetMessages("");
  };

  const GetMedia = () => {
    SetVideo(VideoAvailable);
    SetAudio(AudioAvailable);
  };

  const connect = () => {
    SetAskForUsername(false);
    GetMedia();
  };

  // create function to take video, audio and screen sharing permissions from the user....
  const GetUserPermissions = async () => {
    try {
      // create 2 javascript variables if user allowed video and audio to this website then we make these variables true....
      let hasVideo = false;
      let hasAudio = false;

      // take video permission....
      const video_permission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (video_permission) {
        hasVideo = true;
        SetVideoAvailable(true);

        // Stop track immediately so we can request combined stream later....
        video_permission.getTracks().forEach((track) => track.stop());
      } else {
        SetVideoAvailable(false);
      }

      // take audio permission....
      const audio_permission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audio_permission) {
        hasAudio = true;
        SetAudioAvailable(true);

        // Stop track immediately....
        audio_permission.getTracks().forEach((track) => track.stop());
      } else {
        SetAudioAvailable(false);
      }

      // check if screen sharing is on then change state to true....
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

        // if there is Video and Audio stream then store it into the localStream and also passed it into local Video component through srcObject....
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log("User Permission Error; ", error);
    }
  };

  // silence function generate faxe audio and return it....
  const silence = () => {
    // AudioContext is the browsers build in API which generates completely silent audio track from scratch....
    let audio_context = new AudioContext();
    // createOscillator() generates a continious sound waves(by default, a simple sine wave beep)....
    let oscillator = audio_context.createOscillator();
    // normally the audio is generated for speakers but this createMediaStreamDestination() function converts that audio stream into webRTC compatible audio stream....
    let destination = oscillator.connect(
      audio_context.createMediaStreamDestination(),
    );
    //start the audio context....
    oscillator.start();
    audio_context.resume();
    // Object.assign() will combine or merge these two object destination.stream.getAudioTracks()[0], { enabled: false } and returns a single combined object, getting the first track of stream and set enabled: false because if it left enabled: true then other persons hear a loud beep oscillatory sound, by setting enabled: false, you force it to be pure digital silence. It returns a perfectly valid, running audio track that makes zero noise.
    return Object.assign(destination.stream.getAudioTracks()[0], {
      enabled: false,
    });
  };

  // black function generate black screen video stream and return it, on right side of parameter = {} is the default object parameter....
  const black = ({ width = 640, height = 480 } = {}) => {
    // create element name canvas and sets its width and height called video dimensions 640x480 and this element is invisible because we do not add this element in browsers DOM....
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    // create a rectangle starting at the top left corners(0, 0) to the edges and the default color of rectangle is black....
    canvas.getContext("2d").fillRect(0, 0, width, height);
    // convert html canvas rectangle into live video stream running at 30fps using captureStream() function....
    let stream = canvas.captureStream();
    // return the merged object created using Object.assign(stream.getVideoTracks()[0], {enabled: false}), it will stop the first heavy frames from sending into webRTC engine....
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  // if user's Video and Audio are successfully captured....
  const GetUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }

    // load stream parameter into localStream and srcObject of local video tag....
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    // get all keys or id of connections object....
    for (let id in connections) {
      // only continue further if the id key of connections object is equals to the current user's id so that the offer is only generated for the user connected now not for other users which are already connected....
      if (id === socketIdRef.current) continue;

      // load user's stream into the connections object....
      connections[id].addStream(window.localStream);

      // generate offer(sdp) for the user, set it into localDescription and send it through Websockets....
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    // onended listener is trigger when user turn off its video or audio and both or if user's mic and webcam is disconnected physically, If the video and audio stream completely dies, the WebRTC pipe freaks out. The video on the other person's screen might freeze on an unflattering frame, or the entire connection might collapse, requiring a complex renegotiation process to restart. To prevent this, instead of leaving the pipe empty, we swap the real camera/mic out for a fake, empty stream. The WebRTC pipe stays perfectly intact, data is still flowing, but the other user just sees a black screen and hears silence.....
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            // stops video and audio streaming....
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          // WebRTC connections expect a single MediaStream object that contains both video and audio tracks. the blackSilence() function calls black() (getting the fake video track) and silence() (getting the fake audio track) and bundles them together into a brand new MediaStream....
          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }),
    );
  };

  const GetUserMedia = () => {
    if ((Video && VideoAvailable) || (Audio && AudioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: Video, audio: Audio })
        .then(GetUserMediaSuccess)
        // .then(() => {})
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {}
    }
  };

  useEffect(() => {
    if (Video !== undefined && Audio !== undefined) {
      GetUserMedia();
    }
  }, [Audio, Video]);

  // when user's screen sharing is successfully captured....
  const getDislayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  const getDislayMedia = () => {
    if (ScreenSharing) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (ScreenSharing !== undefined) {
      getDislayMedia();
    }
  }, [ScreenSharing]);

  useEffect(() => {
    GetUserPermissions();
  }, []);

  const GotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  const ConnectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", GotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);

      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        SetVideo((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            PeerConfigConnections,
          );
          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };
          connections[socketListId].onaddstream = (event) => {
            let video_exists = videoRef.current.find(
              (video) => video.socketId === socketListId,
            );

            if (video_exists) {
              SetVideo((videos) => {
                const updatedVideos = videos.map((video) => {
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video;
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
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch (error) {}
            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({
                      session_description: connections[id2].localDescription,
                    }),
                  );
                })
                .catch((error) => console.log(error));
            });
          }
        }
      });
    });
  };

  return (
    <>
      <div>
        {AskForUsername === true ? (
          <div>
            <h2>Enter into Lobby </h2>
            <TextField
              id="outlined-basic"
              label="Username"
              value={Username}
              onChange={(e) => SetUsername(e.target.value)}
              variant="outlined"
            />
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>

            <div>
              <video ref={localVideoRef} autoPlay muted></video>
            </div>
          </div>
        ) : (
          <div className="meetVideoContainer">
            {ShowModal ? (
              <div className="chatRoom">
                <div className="chatContainer">
                  <h1>Chat</h1>

                  <div className="chattingDisplay">
                    {Messages.length !== 0 ? (
                      Messages.map((item, index) => {
                        // console.log(messages);
                        return (
                          <div style={{ marginBottom: "20px" }} key={index}>
                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                            <p>{item.data}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p>No Messages Yet</p>
                    )}
                  </div>

                  <div className="chattingArea">
                    <TextField
                      value={Messages}
                      onChange={(e) => SetMessages(e.target.value)}
                      id="outlined-basic"
                      label="Enter Your chat"
                      variant="outlined"
                    />
                    <Button variant="contained" onClick={sendMessage}>
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )}

            <div className="buttonContainers">
              <IconButton onClick={handleVideo} style={{ color: "white" }}>
                {Video === true ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
              <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                <CallEndIcon />
              </IconButton>
              <IconButton onClick={handleAudio} style={{ color: "white" }}>
                {Audio === true ? <MicIcon /> : <MicOffIcon />}
              </IconButton>

              {ScreenAvailable === true ? (
                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                  {ScreenSharing === true ? (
                    <ScreenShareIcon />
                  ) : (
                    <StopScreenShareIcon />
                  )}
                </IconButton>
              ) : (
                <></>
              )}

              <Badge badgeContent={NewMessages} max={999} color="orange">
                <IconButton
                  onClick={() => SetShowModal(!ShowModal)}
                  style={{ color: "white" }}
                >
                  <ChatIcon />{" "}
                </IconButton>
              </Badge>
            </div>

            <video
              className="meetUserVideo"
              ref={localVideoRef}
              autoPlay
              muted
            ></video>

            <div className="conferenceView">
              {Videos.map((video) => (
                <div key={video.socketId}>
                  <video
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                  ></video>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VideoMeetComponent;
