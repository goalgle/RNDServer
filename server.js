/* eslint-disable no-undef */
const app = require("express")();
const server = require("http").createServer(app);
const routes = require("./routes")
const io = require("socket.io")(server, {
  cors : {
    origin :"*",
    credentials :true
  }
});

const dao = require('./dataAccess')

const port = 3001;

const ioAction = {
  requestJoinGame: 'requestJoinGame', // 게임 참가 요청 - emit / on
  notice: 'notice', // 서버 알림 공지
  
  // API 대체 예정
  
  leaveRoom: 'leaveRoom',
}

// socket
io.on("connection", socket => {
  console.log("a user connected ::: ", socket.id);

  // 게임 요청 확인 및 수락
  // 1. 요청한 roomId 존재여부 확인 - 없으면 생성하고 성공 리턴
  // 2. 요청한 roomId 에 플레이어가 존재하는지 확인 - 게임방 개설했던 인원으로 성공 리턴
  // 3. 요청한 roomId 에 플레이어가 없고 아직 정원이 아닌 경우 - 게임방에 넣고 성공 리턴
  // 4. 요청한 roomId 에 플레이어가 없고 정원이 찼으면 - 실패
  socket.on(ioAction.requestJoinGame, (data) => {

// const {getPlayerList, getRoomList, addRoomList, addPlayerList, deletePlayer, addPlayerToRoom} = require('./dataAccess')

    let returnInfo = null;

    if (data && data.playerId && data.roomId) {
      // 게임을 찾는다. 
      const roomInfo = dao.getRoomList(data.roomId)
      
      // 게임이 없으면 신규 게임 + 신규 플레이어 - 신규게임 roomId 를 생성합니다.
      if (!roomInfo) {
        // 유저정보 저장 - 소켓포함
        const newPlayer = {'playerId': data.playerId, 'socketId': socket.id, 'roomId': data.roomId}
        dao.addPlayerList(newPlayer)

        // 게임정보 저장
        const newRoomInfo = dao.makeNewRoom(data.roomId, newPlayer)
        returnInfo = newRoomInfo
      }

      // 게임이 있고 진행중이며 플레이어가 목록에 있으면 개입 시킨다. - 현재 게임 상태 전송
      else {
        // regist current online player status
        const requestPlayer = {'playerId': data.playerId, 'socketId': socket.id, 'roomId': data.roomId}
        dao.addPlayerList(requestPlayer)

        const alreadyExistInThisRoom = roomInfo?.playerList?.filter(item => item.playerId === data.playerId)?.[0]
        if (alreadyExistInThisRoom) {
          returnInfo = {'roomId': data.roomId, 'playerList': roomInfo.playerList}
        }
        // 게임이 있지만 플레이어 목록에 없으면
        else {
          // 플레이어 정원 4명이 다 차있으면
          if (roomInfo?.playerList?.length > 3) {
            returnInfo = {'roomId': '', 'playerList': []}
          }
          // 아직 정원이 차 있지 않으면 게임인원 추가 - 갱신
          else {
            // 유저정보 저장 - 소켓포함
            const newPlayer = {'playerId': data.playerId, 'socketId': socket.id, 'roomId': data.roomId}
            dao.addPlayerList(newPlayer)

            // 게임정보 저장
            const updatedRoom = dao.addPlayerToRoom(roomInfo.roomId, newPlayer)
            returnInfo = updatedRoom
          }
        }
      }

      // 정상참가인 경우 전체 알림
      if (returnInfo) io.emit(ioAction.requestJoinGame, returnInfo)
    } else {
      console.error('incompleted data ::: ', data)
      socket.emit('incompleted data ::: ', data)
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
    
  })

  // 채팅
  socket.on("chat", msg => {
    const player = dao.getPlayerList()?.filter(item => item.socketId === socket.id)?.[0]
    socket.emit("chat", player?.playerId + ' ::' + msg);
  });

  socket.on("action", (action, id) => {
    socket.broadcast.emit(ioAction.notice, socket.id + ' delete work id:', + id)
  })
});

// http
app.use('/', routes)

server.listen(port, () => console.log("server running on port:" + port));

// 서버 종료시 db 초기화

module.exports = server