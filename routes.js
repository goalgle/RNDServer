var express = require('express');
var router = express.Router();

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
  return '/Users/naxing/Documents/development/socketServer' + path
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
router.get('/api/myInfo/:name', (req, res) => {
  res.header("Content-Type",'application/json');
  res.sendFile(pathResolve('/mock/player_' + req?.params?.name + '.json'));
})

// define the POST
// router.post('/customer', (res, req) => {
//   try {
//     client.query(
//       q.Create(
//         q.Collection('test'),
//         { data: { testField: 'testValue' } }
//       )
//     ).then(function(response) {
//       console.log(response.ref); // Logs the ref to the console.
//     })
//   } catch (e) {
//     console.log(e)
//   }
// })

// define GET customers
// router.get('/customer', (res, req) => {
//   debugger
// })


module.exports = router;