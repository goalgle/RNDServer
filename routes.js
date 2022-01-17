/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
var express = require('express');
var router = express.Router();
const fs = require("fs");

const gameServices = require('./services/game')

// var faunadb = require('faunadb'),
//   q = faunadb.query

// var client = new faunadb.Client({
//   secret: 'fnAEcNoALxACUoUo_uq8RYPaMcQ6GKypX9-ltphQ',
//   domain: 'db.fauna.com',
//   // NOTE: Use the correct domain for your database's Region Group.
//   port: 443,
//   scheme: 'https',
//   keepAlive: false,
// })

const pathResolve = (path) => {
  // /Users/naxing/Documents/development/socketServer/mock/player_A.json
  return '/Users/naxing/Documents/development/RNDServer' + path
}

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});
// define the home page route
router.get('/', function(req, res) {
  res.send('Birds home page');
});
// define the about route
router.get('/about', function(req, res) {
  res.send('About birds');
});

// get my info
router.get('/api/myInfo/:playerId', (req, res) => {
  res.header("Content-Type",'application/json');
  //  /Users/naxing/Documents/development/RNDServer/mock/player_A.json
  res.sendFile(pathResolve('/mock/player_' + req?.params?.playerId + '.json'));
})

// get my info
router.get('/api/gameStatus', (req, res) => {
  // const buffer = fs.readFileSync(pathResolve('/mock/gameStatus_1.json'));
  // res.send(buffer);
  res.header("Content-Type",'application/json');
  res.sendFile(pathResolve('/mock/gameStatus_1.json'));
})

// get roomList
router.get('/api/roomList', (req, res) => {
  res.header("Content-Type",'application/json');
  res.send(db.get('roomList') || []);
})

// post login
router.post('/api/requestJoinGame/:roomId/:playerId', (reqData, res) => {
  const roomId = reqData?.params?.roomId
  const playerId = reqData?.params?.playerId

  if (reqData && roomId && playerId) {
    const result = gameServices.requestJoinGame({roomId, playerId, socketId: reqData?.ip})
    res.header("Content-Type",'application/json');
    res.send(result)
  } else {
    console.error('incompleted data ::: ', reqData)
    res.header("Content-Type",'application/json');
    res.send({resultCode: '777', resultMessage: 'require parameter missing' })
  }
})

// define the POST
router.post('/player', (req, res) => {
  
  console.log('server routes', req.body)
})

// define GET customers
// router.get('/customer', (res, req) => {
//   debugger
// })


module.exports = router;