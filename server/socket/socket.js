// const playgroundRoomId = (roomId) => {
//   return `PLAYGROUND_ACTIVITY_${roomId}`;
// };

const socket = (io) => {
  io.on("connection", (socket) => {
    console.log("socket connected");

    // playground(socket, io);

    socket.on("PLAYGROUND_JOIN_ROOM", ({ roomId }) => {
      socket.join(roomId);

      const room_socket_length = io.sockets.adapter.rooms.get(roomId).size;

      if (room_socket_length === 1) {
        socket.emit("PLAYGROUND_ASSIGN_HOST", { host: true });
      }

      io.to(roomId).emit("PLAYGROUND_UPDATE_CONNECTIONS", {
        connections: room_socket_length,
      });
    });

    socket.on("PLAYGROUND_UPDATE_ACTIVITY", ({ type, roomId }) => {
      socket.to(roomId).emit("PLAYGROUND_UPDATE_ACTIVITY", { type });
    });

    socket.on("disconnecting", (reason) => {
      const rooms = socket.rooms;

      for (var it = rooms.values(), val = null; (val = it.next().value); ) {
        console.log(val);
        const room_socket_length = io.sockets.adapter.rooms.get(val).size;
        console.log({ val, room_socket_length });
        if (room_socket_length > 1) {
          io.to(val).emit("PLAYGROUND_UPDATE_CONNECTIONS", {
            connections: room_socket_length - 1,
          });
        }
      }
      P;
    });
  });
};

module.exports = socket;
