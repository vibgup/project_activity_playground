/**
 * Namespace the Room Id used
 */
// const playgroundRoomId = (roomId) => {
//   return `PLAYGROUND_ACTIVITY_${roomId}`;
// };

/**
 * host ID storage
 * storage maybe moved to a cache layer if need be
 * Can be reviewed for a peer or socket based method
 */
const hostMap = {};

const socket = (io) => {
  io.on("connection", (socket) => {
    socket.on("PLAYGROUND_JOIN_ROOM", ({ roomId }) => {
      socket.join(roomId);

      const room_socket_length = io.sockets.adapter.rooms.get(roomId).size;

      if (room_socket_length === 1) {
        socket.emit("PLAYGROUND_ASSIGN_HOST", { host: true });
        hostMap[socket.id] = roomId;
      } else {
        socket.to(roomId).emit("PLAYGROUND_SYNC_APP");
      }

      io.to(roomId).emit("PLAYGROUND_UPDATE_CONNECTIONS", {
        connections: room_socket_length,
      });
    });

    // socket.on("PLAYGROUND_UPDATE_ACTIVITY", ({ type, roomId }) => {
    //   socket.to(roomId).emit("PLAYGROUND_UPDATE_ACTIVITY", { type });
    // });

    // socket.on("PLAYGROUND_ACTIVITY_EVENT", ({ roomId, ...args }) => {
    //   // console.log("PLAYGROUND_ACTIVITY_EVENT", roomId, { ...args });
    //   socket.to(roomId).emit("PLAYGROUND_ACTIVITY_EVENT", { ...args });
    // });

    socket.on("PLAYGROUND_EMIT_ROOM", ({ emitType, roomId, ...args }) => {
      console.log("PLAYGROUND_EMIT_ROOM", emitType, roomId, { ...args });
      socket.to(roomId).emit(emitType, { ...args });
    });

    socket.on("disconnecting", (reason) => {
      const rooms = socket.rooms;

      for (let roomId of rooms) {
        const roomSetSize = io.sockets.adapter.rooms.get(roomId).size;
        if (roomSetSize > 1) {
          io.to(roomId).emit("PLAYGROUND_UPDATE_CONNECTIONS", {
            connections: roomSetSize - 1,
          });
        }
      }
    });

    socket.on("disconnect", (reason) => {
      if (hostMap[socket.id]) {
        const roomId = hostMap[socket.id];
        delete hostMap[socket.id];

        const roomSocketSet = io.sockets.adapter.rooms.get(roomId);

        if (roomSocketSet) {
          const roomSocketLength = roomSocketSet.size;

          if (roomSocketLength > 0) {
            const socketIdNext = roomSocketSet.values().next().value;
            io.to(socketIdNext).emit("PLAYGROUND_ASSIGN_HOST", { host: true });
            hostMap[socketIdNext] = roomId;
          }
        }
      }
    });
  });
};

module.exports = socket;
