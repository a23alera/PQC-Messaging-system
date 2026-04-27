# PQC-Messaging-system

## Context and aim
This program is a part of a bachelors thesis created by Axel Herre and Alex Ranhög from the University of Skövde.
<br>
<br>
The aim of this program is to serve as a tool in the experiment which is conducted during our research. The tool is to be used to create benchmarks for the encryption algorithm ed25519 along with the quantum-resistant encryption algorithms SLH-DSA and ML-DSA. The tool will benchmark signing-speed, verifying-speed and memory usage.

## About
The program is a fork from the github repo [realtime-chat-api](https://github.com/altrawan/realtime-chat-api) by user altrawan. The changes which has been made from the original repo is the removal of database implementation since all benchmarks are done locally. Ofcourse several encryption modules has also been added.
<br>
<br>
To measure memory usage, the module from github repo [memory-monitor](https://github.com/alexvcasillas/memory-monitor) was implemented in the system.

## How to use
To run the program do the following steps:

### Install dependencies
```bash
npm install
```

### Start server
To start the server run the following commands. <br>/your/path with the path to the project folder.<br>Replace algorithm with either ed25519, slh or ml.
```bash
cd your/path/PQC-Messaging-system/
npm run start:algorithm
```
### Run benchmarks
Before running the benchmarks you may want to tweak the settings. This is done in:
```
PQC-Messaging-system/sendMessage.js
```
The different parameters which can be set are message size(bytes) and number of iterations.

```javascript
socket.on("connect", () => {
  console.log("Connected:", socket.id);

  const messageSize = 1000; //<---- Change message size here

  const messageBuffer = Buffer.alloc(messageSize,"a");

  socket.emit("send-message", {
    sender: "alice",
    receiver: "bob",
    message: messageBuffer.toString("base64"),
    benchmark: { iterations: 100 }//<---- Change number of iterations here
  });
});
```

To run the benchmarks run the following commands. <br>/your/path with the path to the project folder.
```bash
cd /your/path/PQC-Messaging-system/
node sendMessage.js
```
### View results
To view the results run the following commands:
```bash
cd /your/path/PQC-Messaging-system/chat-app/src
node testdata/analyze.js results/filename
```
<b>Replace</b> the filename depending on what algorithm has been benchmarked.<br>

- For ed25519, the correct filename is:

```
Ed25519_latest.json
```
- For ML-DSA, the correct filename is:

```
ml-dsa65_latest.json
```

- For SLH-DSA, the correct filename is:

```
SLH-DSA-SHA2-192s_latest.json
```

Each benchmark is also saved as a CSV file. These files are located together with the json files in the results folder.

## License
MIT License

Copyright (c) 2022 Nur Muhammad Alif Putra Setiawan
<br>
Copyright (c) 2026 Alex Ranhög, Axel Herre


Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
