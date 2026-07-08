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

  const handleVideo = () => {
    SetVideo(!Video);
    // getUserMedia();
  };

  const handleAudio = () => {
    SetAudio(!Audio);
    // getUserMedia();
  };

  const handleScreen = () => {
    SetScreenSharing(!ScreenSharing);
  };

  const handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  const openChat = () => {
    SetShowModal(true);
    SetNewMessages(0);
  };

  const closeChat = () => {
    SetShowModal(false);
  };

  const handleMessage = (e) => {
    SetMessages(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    SetMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      SetMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", Messages, Username);
    SetMessages("");

    // this.setState({ message: "", sender: username })
  };

  const GetMedia = () => {
    SetVideo(VideoAvailable);
    SetAudio(AudioAvailable);
  };

  const connect = () => {
    SetAskForUsername(false);
    GetMedia();
  };

  useEffect(() => {
    if (ScreenSharing !== undefined) {
      getDislayMedia();
    }
  }, [ScreenSharing]);

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

        // Stop track immediately so we can request combined stream later....
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

        // Stop track immediately....
        audio_permission.getTracks().forEach((track) => track.stop());
      } else {
        SetAudioAvailable(false);
      }

      // if screen sharing is on....
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

  // if user's Video and Audio are successfully captured....
  const GetUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
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
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

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
        .GetUserMedia({ video: Video, audio: Audio })
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
    localVideoref.current.srcObject = stream;

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
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

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

  const silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  return (
    <>
      <div>
        {askForUsername === true ? (
          <div>
            <h2>Enter into Lobby </h2>
            <TextField
              id="outlined-basic"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
            />
            <Button variant="contained" onClick={connect}>
              Connect
            </Button>

            <div>
              <video ref={localVideoref} autoPlay muted></video>
            </div>
          </div>
        ) : (
          <div className={styles.meetVideoContainer}>
            {showModal ? (
              <div className={styles.chatRoom}>
                <div className={styles.chatContainer}>
                  <h1>Chat</h1>

                  <div className={styles.chattingDisplay}>
                    {messages.length !== 0 ? (
                      messages.map((item, index) => {
                        console.log(messages);
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

                  <div className={styles.chattingArea}>
                    <TextField
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
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

            <div className={styles.buttonContainers}>
              <IconButton onClick={handleVideo} style={{ color: "white" }}>
                {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
              <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                <CallEndIcon />
              </IconButton>
              <IconButton onClick={handleAudio} style={{ color: "white" }}>
                {audio === true ? <MicIcon /> : <MicOffIcon />}
              </IconButton>

              {screenAvailable === true ? (
                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                  {screen === true ? (
                    <ScreenShareIcon />
                  ) : (
                    <StopScreenShareIcon />
                  )}
                </IconButton>
              ) : (
                <></>
              )}

              <Badge badgeContent={newMessages} max={999} color="orange">
                <IconButton
                  onClick={() => setModal(!showModal)}
                  style={{ color: "white" }}
                >
                  <ChatIcon />{" "}
                </IconButton>
              </Badge>
            </div>

            <video
              className={styles.meetUserVideo}
              ref={localVideoref}
              autoPlay
              muted
            ></video>

            <div className={styles.conferenceView}>
              {videos.map((video) => (
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
