const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const PORT = 3005;

const app = express();

// socket io mandatary code
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res)=>{
    res.sendFile(path.join(__dirname, "index.html"));
})
let players = {};
let currentPlayer = "w";
// socket.io code
io.on("connection", (socket)=>{
    console.log("io connected", socket.id);
    
    if(!players.white){
        players.white = socket.id;
        socket.emit("playerRole", "w");
    }else if(!players.black){
        players.black = socket.id;
        socket.emit("playerRole", "b");
    }else{
        socket.emit("spectator");   
    }


    socket.on("disconnect", ()=>{
        console.log("socket disconnected", socket.id);
        delete players.white;
        delete players.black;
    });

    socket.on("move", (move) => {
        try {
            if(chess.turn() === "w" && socket.id !== players.white) return;
            if(chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            }
            else{
                console.log("invalid move", move);
                socket.emit("invalidMove", move)
            }
        } catch (error) {
            console.log(error.message);
        }
    })

})

// starting server 
server.listen(PORT, ()=>{
    console.log("server started....");
})


