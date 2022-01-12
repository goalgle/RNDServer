/* eslint-disable no-undef */
const app = require("express")();
const server = require("http").createServer(app);
// const cors = require("cors")
const routes = require("./routes")
const io = require("socket.io")(server, {
  cors : {
    origin :"*",
    credentials :true
  }
});
const JSONdb = require('simple-json-db');
const port = 3000;

const ioAction = {
  requestJoinGame: 'requestJoinGame', // 게임 참가 요청 - emit / on
  notice: 'notice', // 서버 알림 공지
  
  // API 대체 예정
  
  leaveRoom: 'leaveRoom',
}


// DB
// /Users/naxing/Documents/development/RNDServer/database.json
const db = new JSONdb('/Users/naxing/Documents/development/RNDServer/database.json');

// socket
io.on("connection", socket => {
  console.log("a user connected ::: ", socket.id);

  // 접속 정보 갱신 - playerList
  // const playerList = db.get('playerList') || []
  // const playerInfo = playerList.filter(item => item.socketId === socket.id)?.[0]

  // 게임 요청 확인 및 수락
  // 1. 요청한 roomId 존재여부 확인 - 없으면 생성하고 성공 리턴
  // 2. 요청한 roomId 에 플레이어가 존재하는지 확인 - 게임방 개설했던 인원으로 성공 리턴
  // 3. 요청한 roomId 에 플레이어가 없고 아직 정원이 아닌 경우 - 게임방에 넣고 성공 리턴
  // 4. 요청한 roomId 에 플레이어가 없고 정원이 찼으면 - 실패
  socket.on(ioAction.requestJoinGame, (data) => {

    db.sync();

    const playerList = db.get('playerList') || []
    const roomList = db.get('roomList') || []

    let returnInfo = null;

    if (data && data.playerId && data.roomId) {
      // 게임을 찾는다. 
      const roomInfo = roomList.filter(item => item.roomId === data.roomId)?.[0]
      
      // 게임이 없으면 신규 게임 + 신규 플레이어 - 신규게임 roomId 를 생성합니다.
      if (!roomInfo) {
        // 게임정보 저장
        roomList.push({'roomId': data.roomId, 'playerList': [{playerId: data.playerId}]})
        db.set('roomList', roomList)

        // 유저정보 저장 - 소켓포함
        playerList.push({'playerId': data.playerId, 'roomId': data.roomId, 'socketId': socket.id})
        db.set('playerList', playerList)
        
        returnInfo = {'roomId': data.roomId, 'playerList': [{playerId: data.playerId}]}
      }

      // 게임이 있고 진행중이며 플레이어가 목록에 있으면 개입 시킨다. - 현재 게임 상태 전송
      else {
        const alreadyExistInThisRoom = roomInfo.playerList.filter(item => item.playerId === data.playerId)?.[0]
        if (alreadyExistInThisRoom) {
          returnInfo = {'roomId': data.roomId, 'playerList': roomInfo.playerList}
        }
        // 게임이 있지만 플레이어 목록에 없으면
        else {
          // 플레이어 정원 4명이 다 차있으면
          if (roomInfo.playerList.length > 3) {
            returnInfo = {'roomId': '', 'playerList': []}
          }
          // 아직 정원이 차 있지 않으면 게임인원 추가 - 갱신
          else {
            // 게임방 정보 갱신
            roomInfo.playerList.push({playerId: data.playerId})
            const roomIdx = roomList.findIndex(item => item.roomId === roomInfo.roomId)
            roomList.splice(roomIdx, 1)
            roomList.push({'roomId': data.roomId, 'playerList': roomInfo.playerList})
            db.set('roomList', roomList)

            // 플레이어 정보 추가
            playerList.push({'playerId': data.playerId, 'roomId': data.roomId, 'socketId': socket.id})

            // 정보 리턴
            returnInfo = {'roomId': data.roomId, 'playerList': roomInfo.playerList}
          }
        }
      }

      // 정상참가인 경우 전체 알림
      if (returnInfo) io.emit(ioAction.requestJoinGame, returnInfo)
    } else {
      console.error('incompleted data ::: ', data)
      socket.emit('incompleted data ::: ', data)
    }
    console.log('DB ::: ', db.JSON())
  })
  
  socket.on('disconnect', () => {
    console.log('user disconnected ::: ', socket.id);
    // 유저정보를 통해 게임 정보 획득
    const playerList = db.get('playerList') || []
    const playerInfo = playerList.filter(item => item.socketId === socket.id)?.[0]

    const playerIdx = playerList.findIndex(item => item.socketId === socket.id)

    // 유저정보 삭제
    if (playerIdx !== -1) playerList.slice(playerIdx, 1)

    // 공지 - 유저 삭제
    socket.broadcast.emit(ioAction.notice, playerInfo?.playerId + ' 유저님이 나갔어요.')
  });

  // 주사위
  socket.on('dice', () => {
    
  })

  // 채팅
  socket.on("chat", msg => {
    console.log(msg);
    socket.emit("chat", 'someone said ::' + msg);
  });

  socket.on("action", (action, id) => {
    socket.broadcast.emit(ioAction.notice, socket.id + ' delete work id:', + id)
  })
});

// http
app.use('/', routes)

server.listen(port, () => console.log("server running on port:" + port));

module.exports = server