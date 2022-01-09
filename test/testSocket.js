// /* eslint-disable no-undef */
// const io = require('socket.io-client');
// const chai = require('chai')
// const options = {
//   transports: ['websocket'],
//   'force new connection': true
// };

// chai.should()

// const serverUrl = 'http://localhost:3001'
// // const room = 'lobby'

// // describe('RND server socket', () => {
// //   describe('socket connect', () => {
//     it('should send and receive a message', (done) => {

//       // 4명의 플레이어에 대한 검증을 위한 카운트
//       let client1cc = 0;  
//       // let client2cc = 0;

//       const client1 = io.connect(serverUrl, options)
//       client1.on('connectNotice', msg => { // 최초 접속 후 socket id 를 받는다.
//         console.log('connectNotice ::: ', msg)
//         // client1cc++
//       })

//       client1.on('enteranceNotice', msg => {
//         console.log('enteranceNotice ::: ', msg)
//       })

//       setTimeout(() => {
//         client1cc.should.be.equal(1);
//         // expect(client2cc).to.equal(0);
//         client1.disconnect();
//         // client2.disconnect();
//         done();
//       }, 25);
      
//     })

//       // client1.on('connect', function(){
//       //   client1.emit('join room', room);

//       //   // Set up client2 connection
//       //   client2 = io.connect(socketUrl, options);

//       //   client2.on('connect', function(){

//       //     // Emit event when all clients are connected.
//       //     client2.emit('join room', room);
//       //     client2.emit('message', 'test');
//       //   });
//       // });
// //   })
// // })


