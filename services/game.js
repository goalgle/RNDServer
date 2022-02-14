// API SET for GAME
const dao = require('../dataAccess')

const ruleConstant = require('../constants/rule')?.rule

const gameService = {}

gameService.requestJoinGame = (data) => {

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

    // 본인이 게임에 등록되어 있으면 정보 업데이트
    const bJoin = roomInfo?.playerList?.some(item => item.playerId === requestPlayer.playerId)
    if (bJoin) {
      returnInfo = dao.addPlayerToRoom(roomInfo.roomId, requestPlayer)
    } else if (roomInfo?.playerList?.length > 3) {
      returnInfo = {'roomId': '', 'playerList': []}
    } else {
      returnInfo = dao.addPlayerToRoom(roomInfo.roomId, requestPlayer)
    }
  }
  return returnInfo
}

gameService.getRoomList = () => {
  return dao.getRoomList()
}

gameService.getRoomInfo = (roomId) => {
  return dao.getRoomInfo(roomId)
}

gameService.getPlayerList = () => {
  return dao.getPlayerList()
}

gameService.deleteOldRoom = () => {
  return dao.deleteOldRoom()
}

gameService.setStart = (roomId) => {
  // rule 에 따라 플레이어 맞춤 
  const roomInfo = dao.getRoomInfo(roomId)
  const roomPlayerList = roomInfo?.playerList || []

  if ((ruleConstant.players - roomPlayerList.length) > 0) { // roomPlayerList 는 적어도 한명 존재(자신)
    // 인원수 확장
    const dummyPlayerId = ['A', 'B', 'C', 'D']
    for(i = roomPlayerList.length; i < ruleConstant.players; i++) { // 1, 2, 3
      console.log('player expand for auto >> ', dummyPlayerId[i])
      dao.addPlayerToRoom(roomId, { playerId: dummyPlayerId[i], socketId: 'AUTO', roomId: roomId})
    }
  }
  // 온라인 체크
  const expandedPlayerList = dao.getRoomInfo(roomId).playerList || [] // expaneded to 4
  const onlinePlayerInRoom = dao.getPlayerList()?.filter(item => item.roomId === roomId)

  expandedPlayerList.forEach((item, idx) => {
    const bOnline = onlinePlayerInRoom.some(v => v.playerId === item.playerId)
    if (!bOnline) {
      dao.updatePlayerInfoInRoom(roomId, item.playerId, {socketId: 'AUTO'})
    }
    if (idx < 2) { // 0, 1 vs 2, 3
      dao.updatePlayerInfoInRoom(roomId, item.playerId, {team: 'I'})
    } else {
      dao.updatePlayerInfoInRoom(roomId, item.playerId, {team: 'II'})
    }
  })

  // TURN 셋팅
  dao.setTurn(roomId)

  // TEAM 셋팅
  const playerList = dao.getRoomInfo(roomId)?.playerList || []
  // sorry for hard-coding
  const playersPerTeam = ruleConstant.players / ruleConstant.teams
  const teamI = playerList.slice(0, playersPerTeam)
  const teamII = playerList.slice(playersPerTeam, playerList.length)

  // SCORE 초기화
  dao.clearScore(roomId)

  const updatedRoomInfo = dao.setTeams(roomId, {'I': teamI, 'II': teamII})
  return updatedRoomInfo
}

gameService.rollDice = (roomId, playerId, diceResult) => {
  // increase round
  const updatedRoomInfo = dao.updateRound(roomId, playerId, diceResult)
  return updatedRoomInfo
}

gameService.setScore = (roomId, teamName, score) => {
  const updatedRoomInfo = dao.updateScore(roomId, teamName, score)
  return updatedRoomInfo
}

gameService.deletePlayer = (socketId) => {
  const deletedPlayer = dao.deletePlayer(socketId)
  return deletedPlayer
}

gameService.getPlayerInfoBySocket = (socketId) => {
  const player = dao.getPlayerInfoBySocket(socketId)
  return player
}

// TEST
gameService.deleteRoomList = () => {
  dao.deleteRoomList()
}

module.exports = gameService