const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");


const app = express();
app.use(express.json());
app.use(cors());


const httpServer = createServer(app);
const io = new Server(httpServer, {
  path: "/real-time",
  cors: {
    origin: "*",
  },
});


const db = {
  players: [],
  gameStarted: false,
  marcoHasCalled: false, // Nueva propiedad para controlar si Marco ha gritado
};


io.on("connection", (socket) => {
  socket.on("joinGame", (user) => {
    if (!db.gameStarted) {
      db.players.push({ id: socket.id, nickname: user.nickname, role: null });
      io.emit("userJoined", db);
    } else {
      socket.emit("error", "El juego ya ha comenzado. No puedes unirte.");
    }
  });


  socket.on("startGame", () => {
    if (db.players.length >= 3 && !db.gameStarted) {
      db.gameStarted = true;
      assignRoles();
      io.emit("gameStarted", db);
    } else if (db.players.length < 3) {
      socket.emit("error", "Se necesitan al menos 3 jugadores para iniciar el juego.");
    }
  });


  socket.on("notifyMarco", () => {
    db.marcoHasCalled = true;
    io.emit("marcoCalled");
  });
  


  socket.on("notifyPolo", () => {
    if (!db.marcoHasCalled) {
      socket.emit("error", "No puedes gritar hasta que Marco grite.");
      return;
    }
    const polos = db.players.filter(player => player.role.includes("Polo"));
    const marco = db.players.find(player => player.role === "Marco");
  
    if (marco) {
      io.to(marco.id).emit("poloList", polos);
    }
  });
  

  socket.on("selectPolo", (selectedPolo) => {
    const marco = db.players.find(player => player.role === "Marco");
  
    // Asegurar que el Marco solo pueda seleccionar una vez
    if (!marco || marco.hasSelected) {
      socket.emit("error", "Ya has seleccionado un Polo.");
      return;
    }
  
    const polo = db.players.find(player => player.nickname === selectedPolo.nickname);
  
    if (polo.role === "Polo especial") {
      io.emit("gameEnded", "El juego ha terminado. Marco ha ganado.");
      db.gameStarted = false;
      resetGame();
    } else {
      // Swap roles
      marco.role = "Polo";
      polo.role = "Marco";
      io.emit("roleSwap", db);
    }
  
    // Marcar que Marco ha hecho su selección
    marco.hasSelected = true;
  });



  socket.on("disconnect", () => {
    db.players = db.players.filter(player => player.id !== socket.id);
    if (db.players.length < 3 && db.gameStarted) {
      io.emit("gameEnded", "El juego se ha detenido debido a que hay menos de 3 jugadores.");
      db.gameStarted = false;
      resetGame();
    }
    io.emit("userLeft", db);
  });
});


function assignRoles() {
  const players = [...db.players];
  const marcoIndex = Math.floor(Math.random() * players.length);
  players[marcoIndex].role = "Marco";


  let specialPoloIndex;
  do {
    specialPoloIndex = Math.floor(Math.random() * players.length);
  } while (specialPoloIndex === marcoIndex);


  players[specialPoloIndex].role = "Polo especial";


  players.forEach((player, index) => {
    if (index !== marcoIndex && index !== specialPoloIndex) {
      player.role = "Polo";
    }
  });
}


function resetGame() {
  db.players.forEach(player => {
    player.role = null;
    player.hasSelected = false;
  });
  db.marcoHasCalled = false; // Reinicia la bandera de Marco
}



httpServer.listen(5050, () => {
  console.log(`Server is running on http://localhost:5050`);
});