let socket = io("http://localhost:5050", { path: "/real-time" });


document.getElementById("join-button").addEventListener("click", fetchData);
document.getElementById("start-button").addEventListener("click", startGame);
document.getElementById("polo-list").style.display = "none";


async function fetchData() {
  const nickname = document.getElementById("nickname").value;
  socket.emit("joinGame", { nickname });
}


async function startGame() {
  socket.emit("startGame");
}


socket.on("userJoined", (data) => {
  const playersList = document.getElementById("players-list");
  playersList.innerHTML = "";
  data.players.forEach(player => {
    const li = document.createElement("li");
    li.textContent = player.nickname;
    playersList.appendChild(li);
  });
  document.getElementById("start-button").style.display = data.players.length >= 3 ? "block" : "none";
});


socket.on("gameStarted", (data) => {
  const currentPlayer = data.players.find(p => p.id === socket.id);
  document.getElementById("role").textContent = `Eres: ${currentPlayer.role}`;


  if (currentPlayer.role === "Marco") {
    document.getElementById("marco-button").style.display = "block";
  } else {
    document.getElementById("polo-button").style.display = "flex";
  }
});


document.getElementById("marco-button").addEventListener("click", () => {
  socket.emit("notifyMarco");
});


document.getElementById("polo-button").addEventListener("click", () => {
  socket.emit("notifyPolo");
});


socket.on("marcoCalled", () => {
  alert("Marco ha gritado. Los Polos deben gritar ahora.");
});


socket.on("poloList", (polos) => {
  const poloList = document.getElementById("polo-list");
  poloList.innerHTML = "";
  polos.forEach(polo => {
    const li = document.createElement("li");
    li.textContent = polo.nickname;
    li.addEventListener("click", () => {
      socket.emit("selectPolo", polo);
      // Oculta la lista de polos después de la selección
      poloList.style.display = "none";
    });
    poloList.appendChild(li);
  });
  // Muestra la lista inicialmente
  poloList.style.display = "flex";
});


socket.on("roleSwap", (data) => {
  const currentPlayer = data.players.find(p => p.id === socket.id);
  document.getElementById("role").textContent = `Eres: ${currentPlayer.role}`;


  if (currentPlayer.role === "Marco") {
    document.getElementById("marco-button").style.display = "block";
    document.getElementById("polo-button").style.display = "none";
  } else {
    document.getElementById("marco-button").style.display = "none";
    document.getElementById("polo-button").style.display = "block";
  }
});


socket.on("gameEnded", (message) => {
  alert(message);
  document.getElementById("role").textContent = "";
  document.getElementById("marco-button").style.display = "none";
  document.getElementById("polo-button").style.display = "none";
});


socket.on("error", (errorMessage) => {
  alert(errorMessage);
});