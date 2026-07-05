import express from "express";
import cors from "cors";
import {createServer} from "node:http";
import {Server} from "socket.io";
import mongoose from "mongoose";
import { ConnectToSocket } from "./src/controllers/SocketManager";
import UserRoutes from "./src/routes/users.routes";

// const PORT = 3000;
const app = express();
const server = createServer(app);
// const socket_io = new Server(server);
const socket_io = ConnectToSocket(server);
app.set("port", PORT);
app.use(cors());
app.use(express.json({limit:"40kb"}));
app.use(express.urlencoded({extended:true, limit:"40kb"}));
app.use("/api/v1/users", UserRoutes);

// app.listen(PORT, () => {
//     console.log("The Server is working successfully....");
// });
server.listen(app.get("port"), () => {
    const mongodb_connect = mongoose.connect("mongodb://localhost:27017/video_conference_app_database");
    console.log(`Successfully connected to HOST: ${mongodb_connect.connection.host}`);
    console.log("The Server is working successfully....");
});