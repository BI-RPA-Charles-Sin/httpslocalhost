const fs = require("fs");
const io = require("socket.io")();
const path = require("path");
const cors = require("cors");

const key = fs.readFileSync("./CA/tls.com/tls.decrypted.key");
const cert = fs.readFileSync("./CA/tls.com/tls.crt");

const express = require("express");
const app = express();

app.use(cors());

const https = require("https");
const server = https.createServer({ key, cert }, app);

const port = 443;
server.listen(port, () => {
  console.log(`Server is listening on https://localhost:${port}`);
});

var servIo = io.listen(server, {
  cors: true,
  origin: "*",
  credentials: true,
  forceBase64: true,
});

const connectedUsers = {};

servIo.on("connection", function (socket) {
  //   let cert = socket.client.request.client.authorized.getPeerCertificate();
  let cert = socket.client.request.client.authorized;

  console.log(socket.handshake.auth);
  console.log({ cert });

  const { user_id } = socket.handshake.query;

  connectedUsers[user_id] = socket.id;

  setInterval(function () {
    console.log({ socket });
    socket.emit("second", { second: new Date().getTime() });
  }, 1000);
});

app.use((req, res, next) => {
  req.io = io;
  req.connectedUsers = connectedUsers;

  return next();
});

app.get("/", (req, res, next) => {
  if (req.socket.getPeerCertificate()) {
    console.log("req.socket is empty");
    console.log(req.socket.getPeerCertificate());
  }

  console.log("JSON.stringify(req.headers): ");
  console.log(JSON.stringify(req.headers));

  // res.status(200).send("Hello world!");
  res.sendFile("./index.html", { root: __dirname });
});
