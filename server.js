const app = require("express")();
const server = require("http").createServer(app);
// const cors = require("cors")
const routes = require("./routes")
const io = require("socket.io")(server, {
  cors : {
    origin :"*",
    credentials :true
  }
});
const port = 3001;

// socket
io.on("connection", socket => {
  console.log("a user connected ::: ", socket.id);
  
  socket.broadcast.emit('notice', socket.id + ' entered. say HI')

  socket.on('disconnect', () => {
    console.log('user disconnected ::: ', socket.id);
    socket.broadcast.emit('notice', socket.id + ' left. say BYE')
  });

  socket.on("chat", msg => {
    console.log(msg);
    io.emit("chat", msg + ' so what?');
  });

  socket.on("action", (action, id) => {
    socket.broadcast.emit('notice', socket.id + ' delete work id:', + id)
  })
});

// http
app.use('/', routes)

server.listen(port, () => console.log("server running on port:" + port));