import {Server} from "socket.io";

let connections = {}; 
let messages = {};
let timeOnline = {};

export const ConnectToSocket = (server) => {
    const socket_io = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"], 
            allowedHeaders: ["*"],
            credentials: true, 
        }
    });

    socket_io.on("connection", (socket) => {
        console.log("Connected"); 
        // console.log(socket);
        socket.on("join-call", (path) => {
            if(connections[path] === "undefined"){
                connections[path] = []
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            for(let a=0; a<connections[path].length; a++){
                socket_io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
            }

            // connections[path].forEach((element) => {
            //     socket_io.to(element).emit("user-joined", socket.id, connections[path]);
            // });

            if(messages[path]!==undefined){
                for(let a=0; a < messages[path].length; a++){
                    socket_io.to(socket.id).emit("chat-message", messages[path][a]["data"], messages[path][a]["sender"], messages[path][a]["socket-id-sender"]);
                }
            }
        });

        socket.on("signal", (to_id, message) => {
            socket_io.to(to_id).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
                if(!isFound && roomValue.includes(socket.id)){
                    return [roomKey, true]
                }
                return [room, isFound]
            }, ["", false]);
            if(found === true){
                if(messages[matchingRoom]===undefined){
                    messages[matchingRoom] = []
                }
                messages[matchingRoom].push({"sender": sender, "data": data, "socket-id-sender": socket.id});
                console.log("message", sender, data);
                
                connections[matchingRoom].forEach((element) => {
                    socket_io.to(element).emit("chat-message", data, sender, socket.id); 
                });
            }
        });

        socket.on("disconnect", () => {
            let varTime = Math.abs(timeOnline[socket.id] - new Date());
            let key; 
            for(const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))){
                for(let a=0; a<v.length; a++){
                    if(v[a]===socket.id){
                        key = k;
                        for(let a=0; a<connections[key].length; a++){
                            socket_io.to(connections[key][a]).emit("user-left", socket.id);
                        }

                        let index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        if(connections[key].length===0){
                            delete connections[key]
                        }
                    }
                }
            }
        });
    });

    return socket_io;
};