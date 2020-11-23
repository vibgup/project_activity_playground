const playground_socket = (socket, io) => {
    socket.on('PLAYGROUND_JOIN_ROOM', ({ roomId }) => {
        socket.join(roomId);

        const room_socket = io.sockets.adapter.rooms[roomId];
        const room_socket_length = room_socket.length;
        
        if (room_socket_length === 1) {
            socket.emit('PLAYGROUND_ASSIGN_HOST', { host: true });
        }

        socket.emit('PLAYGROUND_UPDATE_CONNECTIONS', { connections: room_socket_length });

    });

    socket.on('PLAYGROUND_UPDATE_ACTIVITY', ({type, roomId}) => {});
};

module.export = playground_socket;