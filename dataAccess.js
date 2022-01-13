/**
 * db access action layer
 */

const JSONdb = require('simple-json-db');
const db = new JSONdb('/Users/naxing/Documents/development/RNDServer/database_local.json');

db.sync();

// dao.getPlayerList()
const getPlayerList = () => db.get("playerList")

// dao.getRoomList()
const getRoomList = () => db.get("roomList")

// dao.addRoomList(roomObject)
const addRoomList = (room) => {
  // check exist
  const roomList = db.get("roomList")
  const existRoom = roomList.filter(item => item.roomId === room.roomId)
  const existIdx = roomList.findIndex(item => item.roomId === room.roomId)

  if (existRoom) {
    // replace : remove and add
    roomList.splice(existIdx, 1)
    roomList.push(room)
    
  } else {
    // push
    roomList.push(room)
  }
  db.set("roomList", roomList)
  db.sync();
  return roomList
}

// dao.addPlayerList(playerObject)
const addPlayerList = (player) => {
  const playerList = db.get("playerList")
  const existPlayer = playerList.filter(item => item.playerId === player.playerId)
  const existPlayerIdx = playerList.findIndex(item => item.playerId === player.playerId)

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

// dao.deletePlayer(socketId)
const deletePlayer = (socketId) => {
  const playerList = db.get("playerList")
  const existPlayer = playerList.filter(item => item.socketId === socketId)

  if(existPlayer) {
    const existPlayerIdx = playerList.findIndex(item => item.socketId === socketId)
    playerList.splice(existPlayerIdx, 1)
    db.set("playerList", playerList)
    db.sync()
    return existPlayer
  }
  return false
}

// dao.addPlayerListInRoom(roomId, playerObject)
const addPlayerToRoom = (roomId, player) => {
  const roomList = db.get("roomList")
  const existRoom = roomList.filter(item => item.roomId === roomId)
  const existRoomIdx = roomList.findIndex(item => item.roomId === roomId)

  if (existRoom) {
    const existPlayer = existRoom.playerList.filter(item => item.playerId === player.playerId)
    if (!existPlayer) {
      existRoom.playerList.push(player)
      // replace roomList with new room information
      roomList.splice(existRoomIdx, 1)
      roomList.push(existRoom)
      db.set("roomList", roomList)
      db.sync()
      return roomList
    } else {
      // 해당 방이 있고 그 방에 유저가 있으면 do nothing
    }
    return false
  }
}

    