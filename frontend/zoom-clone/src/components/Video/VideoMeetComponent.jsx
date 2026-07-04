import React, {useState, useRef} from "react";

const server_url = "http://localhost:8000";
let connections = {}
const PeerConfigConnections = {
    "iceServer": [
        {"urls": "stun:stun.l.google.com:19302"}
    ]
};

const VideoMeetComponent = () => {
    const socketRef = useRef();
    const socketIdRef = useRef(); 
    const localVideoRef = useRef(); 
    const [VideoAvailable, SetVideoAvailable] = useState(true); 
    const [AudioAvailable, SetAudioAvailable] = useState(true);
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

    return(
        <>
        <div>
            {AskForUsername === true ? (
                <>
                <div>

                </div>
                </>
            ) : (
                <>
                <div>
                    
                </div>
                </>
            )}
        </div>
        </>
    );
};

export default VideoMeetComponent;