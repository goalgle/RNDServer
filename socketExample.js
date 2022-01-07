const io = require("socket.io")

io.on('connect', onConnect);

// 서버측 코드
function onConnect(socket) {

  // 소켓에 해당하는 client에게 발송
  socket.emit('message', "this is a test");

  // io에 물려있는 모든 socket에게 발송
  io.emit('message', "this is a test");

  // socket에 해당하는 client를 제외하고 모두 발송 ==> socket이 broadcasting 했다는 의미
  socket.broadcast.emit('message', "this is a test");

  // sending to all clients in 'game' room(channel) except sender
  socket.broadcast.to('game').emit('message', 'nice game');

  // sending to all clients in 'game' room(channel), include sender
  io.in('game').emit('message', 'cool game');

  // sending to sender client, only if they are in 'game' room(channel)
  socket.to('game').emit('message', 'enjoy the game');

  // sending to all clients in namespace 'myNamespace', include sender
  io.of('myNamespace').emit('message', 'gg');

  // sending to individual socketid
  socket.broadcast.to(socket.id).emit('message', 'for your eyes only');

  // list socketid
  // for (var socketid in io.sockets.sockets) {} OR
  Object.keys(io.sockets.sockets).forEach((socketid) => {console.log(socketid)});



  // send to current request socket client
  socket.emit('message', "this is a test");// Hasn't changed

  // sending to all clients, include sender
  io.sockets.emit('message', "this is a test"); // Old way, still compatible
  io.emit('message', 'this is a test');// New way, works only in 1.x

  // sending to all clients except sender
  socket.broadcast.emit('message', "this is a test");// Hasn't changed

  // sending to all clients in 'game' room(channel) except sender
  socket.broadcast.to('game').emit('message', 'nice game');// Hasn't changed

  // sending to all clients in 'game' room(channel), include sender
  io.sockets.in('game').emit('message', 'cool game');// Old way, DOES NOT WORK ANYMORE
  io.in('game').emit('message', 'cool game');// New way
  io.to('game').emit('message', 'cool game');// New way, "in" or "to" are the exact same: "And then simply use to or in (they are the same) when broadcasting or emitting:" from http://socket.io/docs/rooms-and-namespaces/

  // sending to individual socketid, socketid is like a room
  io.sockets.socket(socket.id).emit('message', 'for your eyes only');// Old way, DOES NOT WORK ANYMORE
  socket.broadcast.to(socket.id).emit('message', 'for your eyes only');// New 

  // sending to the client
  socket.emit('hello', 'can you hear me?', 1, 2, 'abc');

  // sending to all clients except sender
  socket.broadcast.emit('broadcast', 'hello friends!');

  // sending to all clients in 'game' room except sender
  socket.to('game').emit('nice game', "let's play a game");

  // sending to all clients in 'game1' and/or in 'game2' room, except sender
  socket.to('game1').to('game2').emit('nice game', "let's play a game (too)");

  // sending to all clients in 'game' room, including sender
  io.in('game').emit('big-announcement', 'the game will start soon');

  // sending to all clients in namespace 'myNamespace', including sender
  io.of('myNamespace').emit('bigger-announcement', 'the tournament will start soon');

  // sending to individual socketid (private message)
  socket.to(socket.id).emit('hey', 'I just met you');

  // sending with acknowledgement
  socket.emit('question', 'do you think so?', function (answer) { console.log(answer)});

  // sending without compression
  socket.compress(false).emit('uncompressed', "that's rough");

  // sending a message that might be dropped if the client is not ready to receive messages
  socket.volatile.emit('maybe', 'do you really need it?');

  // sending to all clients on this node (when using multiple nodes)
  io.local.emit('hi', 'my lovely babies');




  // basic emit
  socket.emit(/* ... */);

  // to all clients in the current namespace except the sender
  socket.broadcast.emit(/* ... */);

  // to all clients in room1 except the sender
  socket.to("room1").emit(/* ... */);

  // to all clients in room1 and/or room2 except the sender
  socket.to(["room1", "room2"]).emit(/* ... */);

  // to all clients in room1
  io.in("room1").emit(/* ... */);

  // to all clients in room1 and/or room2 except those in room3
  io.to(["room1", "room2"]).except("room3").emit(/* ... */);

  // to all clients in namespace "myNamespace"
  io.of("myNamespace").emit(/* ... */);

  // to all clients in room1 in namespace "myNamespace"
  io.of("myNamespace").to("room1").emit(/* ... */);

  // to individual socketid (private message)
  io.to(socket.id).emit(/* ... */);

  // to all clients on this node (when using multiple nodes)
  io.local.emit(/* ... */);

  // to all connected clients
  io.emit(/* ... */);

  // WARNING: `socket.to(socket.id).emit()` will NOT work, as it will send to everyone in the room
  // named `socket.id` but the sender. Please use the classic `socket.emit()` instead.

  // with acknowledgement
  socket.emit("question", (answer) => {
      console.log(answer)
  });

  // without compression
  socket.compress(false).emit(/* ... */);

  // a message that might be dropped if the low-level transport is not writable
  socket.volatile.emit(/* ... */);

}

/**********************
 * CLIENT SIDE
 **********************

  // basic emit
  socket.emit();

  // with acknowledgement
  socket.emit("question", (answer) => {
    // ...
  });

  // without compression
  socket.compress(false).emit(...);

  // a message that might be dropped if the low-level transport is not writable
  socket.volatile.emit( ... );
 */