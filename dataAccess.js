/**
 * db access action layer
 */
const { produce } = require('immer')
const JSONdb = require('simple-json-db');
const db = new JSONdb('/Users/naxing/Documents/development/RNDServer/database_local.json');


// when server restart :: online player and room init
db.set("playerList", [])
// db.set("roomList", []) // 개발중일때 수시로 서버가 리스타트된다.
db.sync();

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
  const existPlayer = playerList?.filter(item => item.playerId === player.playerId)?.[0]
  const existPlayerIdx = playerList?.findIndex(item => item.playerId === player.playerId)

  if (existPlayer) {
    playerList.splice(existPlayerIdx, 1)
    playerList.push(player)
  } else {
    playerList.push(player)
  }
  db.set("playerList", playerList)
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
    return otherPlayers
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

Array.prototype.keyCheckPush = (keyName, mode = 'UPDATE') => {
  console.log(this)
  // mode : "ERROR" ==> insert or error
  // mode : "UPDATE" ==> insert or update
}

const findOne = (array, keyName, keyValue) => {
  if(array instanceof Array) {
    const findItem = array?.filter(item => item[keyName] === keyValue)?.[0]
    return findItem
  } else return {}
}

// dao.addPlayerListInRoom(roomId, playerObject)
module.exports.addPlayerToRoom = (roomId, player) => {
  
  console.log(`DAO ::: addPlayerToRoom >> ROOM_ID : ${roomId} / PLAYER_ID : ${player?.playerId}`)
  const roomList = db.get("roomList") || []
  
  // const roomInfo = findOne(roomList, 'roomId', roomId)
  // const newRoomInfo = produce(roomInfo, draft => {
  //   draft?.playerList?.push(player)
  // })
  // roomList.push(newRoomInfo)

  // db.set("roomList", newRoomInfo)
  // db.sync()

  const existRoom = roomList?.filter(item => item.roomId === roomId)?.[0]
  const existRoomIdx = roomList?.findIndex(item => item.roomId === roomId)

  if (existRoom) {
    const playerListInRoom = existRoom?.playerList || []
    const existPlayer = playerListInRoom?.filter(item => item.playerId === player.playerId)?.[0]
    if (!existPlayer) {
      playerListInRoom.push(player)
      existRoom.playerList = [...playerListInRoom]
      // replace roomList with new room information
      roomList.splice(existRoomIdx, 1)
      roomList.push(existRoom)
      db.set("roomList", roomList)
      db.sync()
      return existRoom
    } else {
      // 해당 방이 있고 그 방에 유저가 있으면 do nothing
    }
    return {}
  } else {
    console.error(roomId + ' : 방이 없어서 addPlayerToRoom 불가')
  }
}

module.exports.deletePlayerInRoom = (roomId, playerId) => {
  const roomInfo = this.getRoomInfo(roomId)
  const playerList = roomInfo.playerList
  // const playerInfo = playerList.filter(item => item.playerId === playerId)
  const playerIdx = playerList.findIndex(item => item.playerId === playerId)
  playerList.splice(playerIdx, 1)

  const roomList = this.getRoomList()
  const roomIdx = roomList.findIndex(item => item.roomId === roomId)
  roomList.splice(roomIdx, 1)

  const newRoomInfo = {...roomInfo, playerList}
  roomList.push(newRoomInfo)

  db.set("roomList", roomList)
  db.sync()
}

module.exports.updatePlayerInfoInRoom = (roomId, playerId, playerOptionInfo) => {
  console.log('DAO ::: updatePlayerInfoInRoom')

  const roomInfo = this.getRoomInfo(roomId)
  const playerListInRoom = roomInfo?.playerList || []

  const playerInfo = playerListInRoom.filter(item => item.playerId === playerId)?.[0]

  const newPlayerInfo = {...playerInfo, ...playerOptionInfo}

  console.log('updatePlayerInfoInRoom ::: new ==> ', JSON.stringify(newPlayerInfo))

  this.deletePlayerInRoom(roomId, playerId)
  this.addPlayerToRoom(roomId, newPlayerInfo)
  
  db.sync()
}

// TEST
module.exports.deleteRoomList = () => {
  db.set("roomList", [])
  db.sync()
}

    