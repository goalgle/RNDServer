/**
 * db access action layer
 */
const { produce } = require('immer')
const JSONdb = require('simple-json-db');
const env = require('./constants/env').env

const localDbPath = '/Users/naxing/Documents/development/RNDServer/database_local.json'
const devDbPath = '/Users/naxing/Documents/development/RNDServer/database.json'

const db = new JSONdb(env.port === '3001' ? devDbPath : localDbPath);

// when server restart :: online player and room init
db.set("playerList", [])
// db.set("roomList", []) // 개발중일때 수시로 서버가 리스타트된다.
db.sync();

// return array
const keyCheckPush = (array, object, keyName, mode = 'UPDATE') => {
  let returnArr = []
  const existIndex = array?.findIndex(item => item[keyName] === object[keyName])
  if (existIndex > -1) {
    if (mode === 'UPDATE') {
      if (existIndex + 1 === array.length) {
        returnArr = [...array.slice(0, existIndex) , object]
      } else {
        returnArr = [...array.slice(0, existIndex) , object, ...array.slice(existIndex+1, array.length)]
      }
    } else {
      console.log(`exist key found >> ${keyName} : ${object[keyName]}`)
    }
  } else {
    if (array && array instanceof Array && array.length > 0) {
      returnArr = [...array, object] // push
    } else {
      returnArr = [object]
    }
  }
  return returnArr
}

// return object
const findOne = (array, keyName, keyValue) => {
  if(array instanceof Array) {
    const findItem = array?.filter(item => item[keyName] === keyValue)?.[0]
    return findItem
  } else return {}
}

// 하는 thread worker를 생성한다.

// 10분단위로 roomList 를 검사하고 삭제
module.exports.deleteOldRoom = () => {
  const availInterval = 30 // 10min
  const roomList = db.get("roomList") || []
  const availTimestamp = new Date().getTime() + availInterval * 1000 * 60
  
  const availRoomList = roomList.filter(item => (availTimestamp - item.timeStamp) > 0)

  db.set("roomList", availRoomList)
  db.sync()
}


// dao.getPlayerList()
module.exports.getPlayerList = () => db.get("playerList") || []
module.exports.getPlayerInfo = (playerId) => db.get("playerList").filter(item => item.playerId === playerId)?.[0]
module.exports.getPlayerInfoBySocket = (socketId) => db.get("playerList").filter(item => item.socketId === socketId)?.[0]

// dao.getRoomList()
module.exports.getRoomList = () => db.get("roomList") || []
module.exports.getRoomInfo = (roomId) => db.get("roomList")?.filter(item => item.roomId === roomId)?.[0]

// dao.addRoomList(roomObject)
// module.exports.addRoomList = (room) => {
//   console.log('DAO ::: addRoomList')
//   // check exist
//   const roomList = db.get("roomList") || []
//   const existRoom = roomList?.filter(item => item.roomId === room.roomId)?.[0]
//   const existIdx = roomList?.findIndex(item => item.roomId === room.roomId)

//   if (existRoom) {
//     // replace : remove and add
//     roomList.splice(existIdx, 1)
//     roomList.push(room)
    
//   } else {
//     // push
//     roomList.push(room)
//   }
//   db.set("roomList", roomList)
//   db.sync();
//   return roomList
// }

// dao.addPlayerList(playerObject)
module.exports.addPlayerList = (player) => {
  console.log('DAO ::: addPlayerList')
  const playerList = db.get("playerList") || []

  const newPlayerList = keyCheckPush(playerList, player, 'playerId')

  db.set("playerList", newPlayerList)
  db.sync()
  return playerList
} 

// dao.deletePlayer(socketId) // deleteOnlinePlayer
module.exports.deletePlayer = (socketId) => {
  const playerList = db.get("playerList") || []
  const existPlayer = playerList?.filter(item => item.socketId === socketId)?.[0]

  if(existPlayer) {
    // find all same socket and delete
    const otherPlayers = playerList?.filter(item => item.socketId !== socketId)
    db.set("playerList", otherPlayers)
    db.sync()
    return existPlayer
  }
  return {}
}

module.exports.makeNewRoom = (roomId, player) => {
  console.log('DAO ::: makeNewRoom')
  const roomList = db.get("roomList") || []
  const existRoom = roomList?.filter(item => item.roomId === roomId)?.[0]

  const timeStamp = new Date().getTime() // number : msec (1/1000 sec) ==> 10min : 1*1000*60*10

  if (!existRoom) {
    const newRoom = {
      roomId, 
      playerList: [player], 
      timeStamp, 
      turn: '', 
      score: {"I": [], "II": []},
      host: player.playerId,
      round: 0,
    }
    roomList.push(newRoom)
    db.set("roomList", roomList)
    db.sync()
    return newRoom
  } else {
    console.error(roomId + ' : 방이 이미 있어서 makeNewRoom 불가')
  }
}

// dao.addPlayerListInRoom(roomId, playerObject)
module.exports.addPlayerToRoom = (roomId, player) => {
  console.log(`DAO ::: addPlayerToRoom >> ROOM_ID : ${roomId} / PLAYER_ID : ${player?.playerId}`)
  const roomList = db.get("roomList") || []
  const roomInfo = findOne(roomList, 'roomId', roomId)
  const newRoomInfo = produce(roomInfo, draft => {
    const newPlayerList = keyCheckPush(roomInfo?.playerList, player, 'playerId')
    draft.playerList = newPlayerList // instead of push
  })
  //roomList.push(newRoomInfo)
  const newRoomList = keyCheckPush(roomList, newRoomInfo, 'roomId')
  db.set("roomList", newRoomList)
  db.sync()
  return newRoomInfo
}

// module.exports.deletePlayerInRoom = (roomId, playerId) => {
//   const roomInfo = this.getRoomInfo(roomId)
//   const playerList = roomInfo.playerList
//   // const playerInfo = playerList.filter(item => item.playerId === playerId)
//   const playerIdx = playerList.findIndex(item => item.playerId === playerId)
//   playerList.splice(playerIdx, 1)

//   const roomList = this.getRoomList()
//   const roomIdx = roomList.findIndex(item => item.roomId === roomId)
//   roomList.splice(roomIdx, 1)

//   const newRoomInfo = {...roomInfo, playerList}
//   roomList.push(newRoomInfo)

//   db.set("roomList", roomList)
//   db.sync()
// }

module.exports.updatePlayerInfoInRoom = (roomId, playerId, playerOptionInfo) => {
  console.log('DAO ::: updatePlayerInfoInRoom')

  const roomInfo = this.getRoomInfo(roomId)
  const playerListInRoom = roomInfo?.playerList || []

  const playerInfo = playerListInRoom.filter(item => item.playerId === playerId)?.[0]

  const newPlayerInfo = {...playerInfo, ...playerOptionInfo}

  console.log('updatePlayerInfoInRoom ::: new ==> ', JSON.stringify(newPlayerInfo))

  // this.deletePlayerInRoom(roomId, playerId)
  this.addPlayerToRoom(roomId, newPlayerInfo)
}

// sample game rule
const gameRule = {
  type: 'dice',
  round: 20,
  teams: 2,
  players: 4,
}

const setRoomInfo = (roomInfo) => {
  if (roomInfo && roomInfo?.roomId) {
    const roomList = this.getRoomList()
    const newRoomList = keyCheckPush(roomList, roomInfo, 'roomId')
    db.set('roomList', newRoomList)
    db.sync()
  } else {
    console.error('setRoomInfo fail')
    return {}
  }
}

const nextTurn = (roomInfo) => {
  const round = roomInfo?.round + 1
  const playerList = roomInfo?.playerList
  const whosTurnIdx = round % gameRule.players
  return { turn: playerList?.[whosTurnIdx]?.playerId }
}

module.exports.updateRound = (roomId, playerId, diceResult) => {
  const roomList = this.getRoomList()
  const roomInfo = this.getRoomInfo(roomId)
  const nextRoomInfo = produce(roomInfo, draft => {
    draft.round = roomInfo.round + 1
    draft.turn = nextTurn(roomInfo)?.turn
    draft.diceResult = diceResult
  })
  const newRoomList = keyCheckPush(roomList, nextRoomInfo, 'roomId')
  db.set('roomList', newRoomList)
  db.sync()

  return nextRoomInfo
}

module.exports.setTurn = (roomId) => { // default
  const roomInfo = this.getRoomInfo(roomId)
  const roomPlayerList = roomInfo?.playerList || []
  const onLinePlayerList = roomPlayerList.filter(item => item.socketId !== 'AUTO')
  const nextRoomInfo = produce(roomInfo, draft => {
    draft.turn = roomInfo.host
    draft.round = 0
    // if (roomInfo?.round === 0) {
    //   draft.turn = roomInfo.host
    // } else 
    //   draft.turn = onLinePlayerList?.[0]?.playerId
  })
  setRoomInfo(nextRoomInfo)
  return nextRoomInfo
}

module.exports.setTeams = (roomId, teamInfo) => {
  const roomInfo = this.getRoomInfo(roomId)
  const nextRoomInfo = produce(roomInfo, draft => {
    draft.teams = teamInfo
  })
  setRoomInfo(nextRoomInfo)
  return nextRoomInfo
}

module.exports.updateScore = (roomId, teamName, score) => {
  const roomInfo = this.getRoomInfo(roomId)
  const scoreRound = roomInfo.score.I.length + roomInfo.score.II.length

  if (scoreRound === 12) {
    console.log('GAME OVER?')
    return {} // game over
  }

  // hard coding sorry team : I , II

  let targetTeamName = teamName;
  if (roomInfo.score.I.length >= 6) targetTeamName = "II"
  if (roomInfo.score.II.length >= 6) targetTeamName = "I"
  
  const nextRoomInfo = produce(roomInfo, draft => {
    draft.score[targetTeamName] = [...draft.score[targetTeamName], score]
  })

  setRoomInfo(nextRoomInfo)
  return nextRoomInfo
}

module.exports.clearScore = (roomId) => {
  const roomInfo = this.getRoomInfo(roomId)
  const scoreRound = roomInfo.score.I.length + roomInfo.score.II.length
  
  const nextRoomInfo = produce(roomInfo, draft => {
    draft.score = {I: [], II: []}
    draft.diceResult = ''
  })

  setRoomInfo(nextRoomInfo)
  return nextRoomInfo
}

// TEST
module.exports.deleteRoomList = () => {
  db.set("roomList", [])
  db.sync()
}

    