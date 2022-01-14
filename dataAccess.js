/**
 * db access action layer
 */

const JSONdb = require('simple-json-db');
const db = new JSONdb('/Users/naxing/Documents/development/RNDServer/database.json');

db.set("playerList", [])
db.sync();


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

  if (!existRoom) {
    const newRoom = {roomId: roomId, playerList: [player]}
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
  console.log('DAO ::: addPlayerToRoom')
  const roomList = db.get("roomList") || []
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


    