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
  chat: 'chat', // 채팅
}

// sample game rule
const gameRule = {
  type: 'dice',
  round: 20,
  teams: 2,
  players: 4,
}


try {
  // socket
  io.on("connection", socket => {
    console.log("REQ : IO : connect >> ", socket.id);

    // 게임 요청 확인 및 수락
    // 1. 요청한 roomId 존재여부 확인 - 없으면 생성하고 성공 리턴
    // 2. 요청한 roomId 에 플레이어가 존재하는지 확인 - 게임방 개설했던 인원으로 성공 리턴
    // 3. 요청한 roomId 에 플레이어가 없고 아직 정원이 아닌 경우 - 게임방에 넣고 성공 리턴
    // 4. 요청한 roomId 에 플레이어가 없고 정원이 찼으면 - 실패
    socket.on(ioAction.requestJoinGame, (reqData) => {

      gameServices.deleteOldRoom() // deleting rooms of 30min over

      if (reqData && reqData.playerId && reqData.roomId) {
        const result = gameServices.requestJoinGame({...reqData, socketId: socket.id})
        io.emit(ioAction.requestJoinGame, result)
        io.emit('chat', `${reqData.playerId}님이 참여했어요.`)
      } else {
        console.error('incompleted data ::: ', reqData)
        socket.emit('system', `required paramter fail ::: ${JSON.stringify(reqData)}`)
      }
    })
    
    socket.on('disconnect', () => {
      console.log("REQ : IO : disconnect >> ", socket.id);
      const player = dao.deletePlayer(socket.id)

      // TODO 유저 socket 정보 AUTO

      // 공지 - 유저 삭제
      if (player) socket.broadcast.emit(ioAction.notice, player?.playerId + ' 유저님이 나갔어요.')
    });

    // 인원수 없는 경우 플레이어 늘리고 강제 시작
    socket.on('start', (reqData) => {
      console.log("REQ : IO : start >> ", reqData)
      if (reqData && reqData?.roomId && reqData?.playerId) {

        const roomInfo = gameServices.getRoomInfo(reqData.roomId)

        if (roomInfo.host === reqData.playerId) {
          const updatedRoom = gameServices.setStart(reqData.roomId)
  
          io.emit('notice', 'new game started!')

          socket.emit('start', updatedRoom)

          socket.broadcast.emit('gameUpdate', updatedRoom)
        } else {
          io.emit('chat', reqData.playerId + '님은 방주인이 아니에요')
        }
      } else {
        socket.emit('notice', '필수항목 누락 : ' + JSON.stringify(reqData))
      }
    })
    
    // 주사위
    const socketDice = (socket, reqData) => {
      const roomInfo = gameServices.getRoomInfo(reqData?.roomId)
      let diceResult
      if (roomInfo.turn === reqData.playerId) {
        const min = Math.ceil(1)
        const max = Math.floor(6)
        diceResult = Math.floor(Math.random() * (max - min + 1)) + min

        const updatedRoomInfo = gameServices.rollDice(reqData?.roomId, reqData?.playerId, diceResult)
        socket.emit("dice", diceResult)
        socket.broadcast.emit('gameUpdate', { ...updatedRoomInfo})
      } else {
        io.emit('chat', reqData.playerId + '님 차례가 아니에요.')
      }
      return diceResult
    }

    socket.on('dice', (reqData) => {
      console.log("REQ : IO : dice >> ", reqData)
      // 순서 체크 : 방정보 획득, 유저정보 확인
      if (reqData && reqData?.roomId && reqData?.playerId) {
        socketDice(socket, reqData)
      } else {
        socket.emit('notice', '필수항목 누락 : ' + JSON.stringify(reqData))
      }
    });

    const socketTrade = (socket, reqData) => {
      const roomInfo = gameServices.getRoomInfo(reqData.roomId)
      const isTeamI = roomInfo.teams.I.some(item => item.playerId === reqData.playerId)
      
      if (reqData.trade === 'HAVE') {
        if (isTeamI) {
          // update score to team I
          returnRoomInfo = gameServices.setScore(reqData.roomId, 'I', reqData.diceResult)
        } else {
          // update score to team II
          returnRoomInfo = gameServices.setScore(reqData.roomId, 'II', reqData.diceResult)
        }
      } else if (reqData.trade === 'PASS') {
        if (isTeamI) {
          // update score to team II
          returnRoomInfo = gameServices.setScore(reqData.roomId, 'II', reqData.diceResult)
        } else {
          // update score to team I
          returnRoomInfo = gameServices.setScore(reqData.roomId, 'I', reqData.diceResult)
        }
      } else {
        socket.emit('notice', 'trade 비정의 파라미터 : ' + JSON.stringify(reqData))  
      }
      return returnRoomInfo
    }

    function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    // 거래
    socket.on('trade', async (reqData) => {
      console.log("REQ : IO : trade >> ", reqData)
      let returnRoomInfo;
      if (reqData && reqData?.roomId && reqData?.playerId && reqData?.diceResult && reqData?.trade) {
        returnRoomInfo = socketTrade(socket, reqData)
      } else {
        socket.emit('notice', '필수항목 누락 : ' + JSON.stringify(reqData))
      }

      socket.emit('trade', returnRoomInfo)

      // 다음 유저가 auto 인지 확인
      let nextPlayerIdx = returnRoomInfo.playerList.findIndex(item => item.playerId === returnRoomInfo.turn)
      const playerCount = returnRoomInfo.playerList.length
      for(i = nextPlayerIdx; returnRoomInfo.playerList[i % playerCount].socketId === 'AUTO'; i++) {
        console.log('LOOP CAUTION ::: turn >> ', returnRoomInfo.playerList[nextPlayerIdx].playerId)
        socket.emit('chat', 'auto ' + returnRoomInfo.playerList[nextPlayerIdx].playerId + ' 진행중')
        socket.broadcast.emit('chat', 'auto ' + returnRoomInfo.playerList[nextPlayerIdx].playerId + ' 진행중')
        // 주사위
        await sleep(1000);
        const diceResult = socketDice(socket, {
          roomId: returnRoomInfo.roomId,
          playerId: returnRoomInfo.playerList[nextPlayerIdx].playerId
        })
        await sleep(1000);
        console.log('LOOP CAUTION ::: dice >> ', diceResult)
        // trade 4보다 크면 HAVE 
        const nextRoomInfo = await socketTrade(socket, {
          roomId: returnRoomInfo.roomId, 
          playerId: returnRoomInfo.playerList[nextPlayerIdx].playerId,
          diceResult: diceResult,
          trade: diceResult > 3 ? 'HAVE' : 'PASS'
        })
        io.emit('gameUpdate', nextRoomInfo)
        await sleep(1000);
        console.log('LOOP CAUTION ::: nextRoom >> ', nextRoomInfo.turn)
        nextPlayerIdx = nextRoomInfo.playerList.findIndex(item => item.playerId === nextRoomInfo.turn)
        returnRoomInfo = nextRoomInfo
      }

      socket.emit('trade', returnRoomInfo)
      io.emit('gameUpdate', returnRoomInfo)
    })

    // 채팅
    socket.on("chat", msg => {
      console.log("REQ : IO : chat >> ", socket.id + ' : ' + msg)
      const player = dao.getPlayerInfoBySocket(socket.id)
      if(player) {
        io.emit("chat", player?.playerId + ' ::' + msg);
      } else socket.emit("chat", '당신은 누구십니까?')
    });

    socket.on("action", (action, id) => {
      socket.broadcast.emit(ioAction.notice, socket.id + ' delete work id:', + id)
    })
  });
} catch (e) {
  console.error(e)
  io.emit('system', JSON.stringify(e))
}

// http
// app.use('/', routes)
app.use(cors())
app.use('/',routes,)

server.listen(port, () => {
  console.log("server running on port:" + port)
});

// 서버 종료시 db 초기화 ??

module.exports = server