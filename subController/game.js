// UTIL
const checkRequired = require('../utils/check').checkRequired

// SERVICE LAYER
const gameServices = require('../services/game')

// CONSTANT
const ioConstant = require('../constants/io').io

// sleep for AUTO - player
const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports.requestJoinGame = (io, socket, reqData) => {
  console.log(`IO REQ : requestJoinGame >> , ${socket.id} :: ${JSON.stringify(reqData)}`);
  const { flag, errMsg } = checkRequired(reqData, ['playerId', 'roomId'])
  if (!flag) socket.emit('system', errMsg)
  else {
    const result = gameServices.requestJoinGame({...reqData, socketId: socket.id})
    io.emit(ioConstant.requestJoinGame, result)
    io.emit('chat', `${reqData.playerId}님이 참여했어요.`)
  }
}

module.exports.disconnect = (io, socket, reqData) => {
  console.log(`IO REQ : disconnect >> , ${socket.id} :: ${JSON.stringify(reqData)}`);
  const player = gameServices.deletePlayer(socket.id)
  if (player) socket.broadcast.emit(ioConstant.notice, player?.playerId + ' 유저님이 나갔어요.')
}

module.exports.start = (io, socket, reqData) => {
  console.log(`IO REQ : start >> , ${socket.id} :: ${JSON.stringify(reqData)}`);
  const { flag, errMsg } = checkRequired(reqData, ['playerId', 'roomId'])
  if (!flag) socket.emit('system', errMsg)
  else {
    const roomInfo = gameServices.getRoomInfo(reqData.roomId)

    if (!roomInfo) {
      socket.emit('notice', reqData?.roomId + '의 방이 없어요.')
      return
    }

    if (roomInfo.host === reqData.playerId) {
      const updatedRoom = gameServices.setStart(reqData.roomId)

      io.emit('notice', 'new game started!')

      socket.emit('start', updatedRoom)

      socket.broadcast.emit('gameUpdate', updatedRoom)
    } else {
      io.emit('chat', reqData.playerId + '님은 방주인이 아니에요')
    }
  }
}

const socketDice = (io, socket, reqData) => {
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

module.exports.dice = (io, socket, reqData) => {
  console.log(`IO REQ : dice >> , ${socket.id} :: ${JSON.stringify(reqData)}`);
  const { flag, errMsg } = checkRequired(reqData, ['playerId', 'roomId'])
  if (!flag) socket.emit('system', errMsg)
  else {
    socketDice(io, socket, reqData)
  }
}

const socketTrade = (io, socket, reqData) => {
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

module.exports.trade = async (io, socket, reqData) => {
  console.log(`IO REQ : trade >> , ${socket.id} :: ${JSON.stringify(reqData)}`);
  const { flag, errMsg } = checkRequired(reqData, ['playerId', 'roomId', 'diceResult', 'trade'])
  if (!flag) socket.emit('system', errMsg)
  else {
    let returnRoomInfo = socketTrade(io, socket, reqData)
    socket.emit('trade', returnRoomInfo)

    // 다음 유저가 auto 인지 확인
    let nextPlayerIdx = returnRoomInfo.playerList.findIndex(item => item.playerId === returnRoomInfo.turn)
    const playerCount = returnRoomInfo.playerList.length
    for(i = nextPlayerIdx; returnRoomInfo.playerList[i % playerCount].socketId === 'AUTO'; i++) {
      console.log('LOOP CAUTION ::: turn >> ', returnRoomInfo.playerList[nextPlayerIdx].playerId)
      // socket.emit('chat', 'auto ' + returnRoomInfo.playerList[nextPlayerIdx].playerId + ' 진행중')
      io.emit('chat', 'auto ' + returnRoomInfo.playerList[nextPlayerIdx].playerId + ' 진행중')
      // 주사위
      await sleep(1000);
      const diceResult = await socketDice(io, socket, {
        roomId: returnRoomInfo.roomId,
        playerId: returnRoomInfo.playerList[nextPlayerIdx].playerId
      })
      await sleep(1000);
      console.log('LOOP CAUTION ::: dice >> ', diceResult)
      // trade 4보다 크면 HAVE 
      const nextRoomInfo = await socketTrade(io, socket, {
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
  }
}

module.exports.chat = (io, socket, reqData) => {
  console.log(`IO REQ : chat >> , ${socket.id} :: ${JSON.stringify(reqData)}`);
  const player = gameServices.getPlayerInfoBySocket(socket.id)
  if (player) io.emit("chat", player?.playerId + ' ::' + reqData);  
  else socket.emit("chat", '당신은 누구십니까?')
}