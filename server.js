/* eslint-disable no-undef */
const app = require("express")();
const cors = require("cors");
const server = require("http").createServer(app);
const routes = require("./routes")
const io = require("socket.io")(server, {
  cors : {
    origin :"*",
    credentials :true
  }
});

const gameServices = require('./services/game')

const dao = require('./dataAccess')

const port = 3001;

const ioAction = {
  requestJoinGame: 'requestJoinGame', // 게임 참가 요청 - emit / on
  notice: 'notice', // 서버 알림 공지
  disconnect: 'disconnect', // 접속 해제
  chat: 'chat',
}

// socket
io.on("connection", socket => {
  console.log("a user connected ::: ", socket.id);

  // 게임 요청 확인 및 수락
  // 1. 요청한 roomId 존재여부 확인 - 없으면 생성하고 성공 리턴
  // 2. 요청한 roomId 에 플레이어가 존재하는지 확인 - 게임방 개설했던 인원으로 성공 리턴
  // 3. 요청한 roomId 에 플레이어가 없고 아직 정원이 아닌 경우 - 게임방에 넣고 성공 리턴
  // 4. 요청한 roomId 에 플레이어가 없고 정원이 찼으면 - 실패
  socket.on(ioAction.requestJoinGame, (reqData) => {
    if (reqData && reqData.playerId && reqData.roomId) {
      const result = gameServices.requestJoinGame({...reqData, socketId: socket.id})
      io.emit(ioAction.requestJoinGame, result)
    } else {
      console.error('incompleted data ::: ', reqData)
      socket.emit('incompleted data ::: ', reqData)
    }
  })
  
  socket.on('disconnect', () => {
    console.log('user disconnected ::: ', socket.id);
    const player = dao.deletePlayer(socket.id)

    // 공지 - 유저 삭제
    if (player) socket.broadcast.emit(ioAction.notice, player?.playerId + ' 유저님이 나갔어요.')
  });

  // 주사위
  socket.on('dice', () => {
    const min = Math.ceil(1)
    const max = Math.floor(6)
    const result = Math.floor(Math.random() * (max - min + 1)) + min

    console.log('dice ::: ', result)
    io.emit('dice', {diceResult: result})
  })

  // 채팅
  socket.on("chat", msg => {
    const player = dao.getPlayerInfoBySocket(socket.id)
    if(player) io.emit("chat", player?.playerId + ' ::' + msg);
    else socket.emit("chat", '당신은 누구십니까?')    
  });

  socket.on("action", (action, id) => {
    socket.broadcast.emit(ioAction.notice, socket.id + ' delete work id:', + id)
  })
});

// http
// app.use('/', routes)
app.use(cors())
app.use(
  '/',
  routes,
  // createProxyMiddleware(
  //   {target: 'http://localhost:3000', changeOrigin: true}
  // )
)

server.listen(port, () => {
  // after server start

  // make new Thread

  console.log("server running on port:" + port)
});

// 서버 종료시 db 초기화

module.exports = server