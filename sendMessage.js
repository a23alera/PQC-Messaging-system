const io = require("socket.io-client");

const socket = io("http://localhost:4000", {
  transports: ["websocket"],
});

console.log("Client script started");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("send-message", {
    sender: "alice",
    receiver: "bob",
    message: "Hej! Benchmark-test",
    benchmark: { iterations: 10 }
  });
});

socket.on("benchmark-result", (data) => {
  console.log("Resultat:", data);
  socket.disconnect();
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("Connect error:", err.message);
});
