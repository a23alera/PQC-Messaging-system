const io = require("socket.io-client");

const socket = io("http://localhost:4000", {
  transports: ["websocket"],
});

console.log("Client script started");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  const messageSize = 100;

  const messageBuffer = Buffer.alloc(messageSize,"a");

  socket.emit("send-message", {
    sender: "alice",
    receiver: "bob",
    message: messageBuffer.toString("base64"),
    benchmark: { iterations: 10000 }
  });
});

socket.on("benchmark-result", (data) => {
    const iterations = data?.iterations || "okänt antal";
  
    console.log(`Benchmark klart. ${iterations} iterationer kördes.`);
    
    socket.disconnect();
    process.exit(0);
  });

socket.on("connect_error", (err) => {
  console.error("Connect error:", err.message);
});
