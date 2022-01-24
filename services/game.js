// API SET for GAME
const produce = require('immer')
const dao = require('../dataAccess')
const ioAction = {
  requestJoinGame: 'requestJoinGame', // 게임 참가 요청 - emit / on
  notice: 'notice', // 서버 알림 공지
  disconnect: 'disconnect', // 접속 해제
  // API 대체 예정
  
  leaveRoom: 'leaveRoom',
}

// sample game rule
const gameRule = {
  type: 'dice',
  round: 20,
  teams: 2,
  players: 4,
}

/**
 * USAGE - DSL 적용
 * const gameService = require('./services/game')
 * const game = gameService.makeGame(gameInfo)
 * game.join(playerInfo)
 * game.leave(playerInfo)
 * game.score()
 * game.over()
 */

// new Game instance
// module.exports.makeGame(gameInfo) = () => console.log(gameInfo)


module.exports.requestJoinGame = (data) => {

  let returnInfo = null;

  // 게임을 찾는다. 
  const roomInfo = dao.getRoomInfo(data.roomId)
  
  // 게임이 없으면 신규 게임 + 신규 플레이어 - 신규게임 roomId 를 생성합니다.
  if (!roomInfo) {
    // 유저정보 저장 - 소켓포함
    const newPlayer = {'playerId': data.playerId, 'socketId': data.socketId, 'roomId': data.roomId}
    dao.addPlayerList(newPlayer)

    // 게임정보 저장
    const newRoomInfo = dao.makeNewRoom(data.roomId, newPlayer)
    returnInfo = newRoomInfo
  }

  // 게임이 있고 진행중이며 플레이어가 목록에 있으면 개입 시킨다. - 현재 게임 상태 전송
  else {
    // regist current online player status
    const requestPlayer = {'playerId': data.playerId, 'socketId': data.socketId, 'roomId': data.roomId}
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
        const newPlayer = {'playerId': data.playerId, 'socketId': data.socketId, 'roomId': data.roomId}
        dao.addPlayerList(newPlayer)

        // 게임정보 저장
        const updatedRoom = dao.addPlayerToRoom(roomInfo.roomId, newPlayer)
        returnInfo = updatedRoom
      }
    }
  }
  return returnInfo
}

module.exports.getRoomList = () => {
  return dao.getRoomList()
}

module.exports.getRoomInfo = (roomId) => {
  return dao.getRoomInfo(roomId)
}

module.exports.getPlayerList = () => {
  return dao.getPlayerList()
}

module.exports.deleteOldRoom = () => {
  return dao.deleteOldRoom()
}

module.exports.setGamePlayers = (roomId) => {
  // rule 에 따라 플레이어 맞춤 및 turn 결젱
  const roomInfo = dao.getRoomInfo(roomId)
  const roomPlayerList = roomInfo?.playerList || []

  if ((gameRule.players - roomPlayerList.length) > 1) { // roomPlayerList 는 적어도 한명 존재(자신)
    // 인원수 확장
    const dummyPlayerId = ['A', 'B', 'C', 'D']
    for(i = roomPlayerList.length; i < gameRule.players; i++) { // 1, 2, 3
      dao.addPlayerToRoom(roomId, { playerId: dummyPlayerId[i], socketId: 'AUTO', roomId: roomId})
    }
  }
  // 온라인 체크
  const expandedPlayerList = dao.getRoomInfo(roomId).playerList || [] // expaneded to 4
  const onlinePlayerInRoom = dao.getPlayerList()?.filter(item => item.roomId === roomId)

  expandedPlayerList.forEach((item, idx) => {
    const bOnline = onlinePlayerInRoom.some((v, i) => {v.playerId === item.playerId})
    if (!bOnline) dao.updatePlayerInfoInRoom(roomId, item.playerId, {socketId: 'AUTO'})
  })
}

// TEST
module.exports.deleteRoomList = () => {
  dao.deleteRoomList()
}
