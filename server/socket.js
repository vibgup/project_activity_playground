const socket = io => {
    io.on('connection', socket => {
        console.log('connect');
    });
};

module.exports = socket;