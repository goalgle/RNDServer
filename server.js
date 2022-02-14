const app = require("express")();
const cors = require("cors");
const server = require("http").createServer(app);
const routes = require("./controller/routes")
const io = require("socket.io")(server, {
  // 동일IP의 client에서 응답처리를 항기 위해 필요.
  cors : {
    origin :"*",
    credentials :true
  }
});

const { Worker } = require("worker_threads");

// CONSTANT
const ioConstant = require('./constants/io').io
const envConstant = require('./constants/env').env

// SUB-CONTROLLER LAYER
const ioController = require('./controller/ioGame')

// SERVICE LAYER
const gameServices = require('./services/game')

// DATA ACCESS LAYER
const dao = require('./dao/dataAccess')

const loadSocketListener = (socket, ioActionId) => {
  console.log(`LOADING SOCKET LISTENR : ${ioActionId} >> , ${socket.id}`);
  switch(ioActionId) {
    case ioConstant.disconnect : 
      socket.on(ioConstant.disconnect, reqData => ioController.disconnect(io, socket, reqData))
      break;
    case ioConstant.requestJoinGame : 
      socket.on(ioConstant.requestJoinGame, reqData => ioController.requestJoinGame(io, socket, reqData))
      break;
    case ioConstant.start :
      socket.on(ioConstant.start, reqData => ioController.start(io, socket, reqData))
      break;
    case ioConstant.dice :
      socket.on(ioConstant.dice, reqData => ioController.dice(io, socket, reqData))
      break;
    case ioConstant.trade :
      socket.on(ioConstant.trade, reqData => ioController.trade(io, socket, reqData))
      break;
    case ioConstant.chat :
      socket.on(ioConstant.chat, reqData => ioController.chat(io, socket, reqData))
      break;
  }
}

try {
  // socket
  io.on(ioConstant.connection, socket => {
    console.log("REQ : IO : connect >> ", socket.id);

    // EXTEND socket object
    socket.listen = (ioActionId) => loadSocketListener(socket, ioActionId)

    // DELETE OLD ROOM - 30MIN BEFORE
    gameServices.deleteOldRoom()

    // disconnect
    socket.listen(ioConstant.disconnect)
    
    // requestJoinGame
    socket.listen(ioConstant.requestJoinGame)
    
    // start
    socket.listen(ioConstant.start)
    
    // 주사위
    socket.listen(ioConstant.dice)

    // 거래
    socket.listen(ioConstant.trade)

    // 채팅
    socket.listen(ioConstant.chat)
  });
} catch (e) {
  console.error(e)
  // io.emit('system', JSON.stringify(e))
}

// http
// app.use('/', routes)
app.locals.io = io
app.use(cors())
app.use('/',routes,)

server.listen(envConstant.port, () => {
  console.log("server running on port:" + envConstant.port)
});

// 서버 종료시 db 초기화 ??

module.exports = server