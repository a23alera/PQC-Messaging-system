# PQC-Messaging-system

## Context and aim
This program is a part of a bachelors thesis created by Axel Herre and Alex Ranhög from the University of Skövde.
<br>
<br>
The aim of this program is to serve as a tool in the experiment which is conducted during our research. The tool is to be used to create benchmarks for the encryption algorithm ed25519 along with the quantum-resistant encryption algorithms SLH-DSA and ML_DSA. The tool will benchmark signing-speed, verifying-speed and size of the signature.

## About
The program is a fork from the github repo [realtime-chat-api](https://github.com/altrawan/realtime-chat-api) by user altrawan. The changes which has been made from the original repo is the removal of database implementation since all benchmarks are done locally. Ofcourse several encryption modules has also been added.
<br>
<br>

## How to use
To run the program do the following steps:

### Install dependencies
```bash
npm install package.json
```

### Start server
To start the server run the following commands. <br>/your/path with the path to the project folder.<br>Replace algorithm with either ed25519, slh or ml.
```bash
cd your/path/PQC-Messaging-system/chat-app/
npm run start:algorithm
```
### Run benchmarks
To run the benchmarks run the following commands. <br>/your/path with the path to the project folder.
```bash
cd /your/path/PQC-Messaging-system/
node sendmessage.js
```


## License
MIT License

Copyright (c) 2022 Nur Muhammad Alif Putra Setiawan

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