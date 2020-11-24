import { createSlice, createSelector } from "@reduxjs/toolkit";

import socket from "services/socket";

export const activityTypes = {
  whiteboard: "WHITEBOARD",
  video: "VIDEO",
};

/**
 * Slice -> Reducer, Actions
 */

const reducerName = 'playground';
 
const initialState = {
  connectionStatus: false,
  roomId: null,
  isHost: false,
  activeConnections: null,
  activity: null, // WHITEBOARD VIDEO
};

 export const playgroundSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    reset(state, action) {
      state = Object.assign({}, initialState);
    },
    initialize(state, action) {
      const {
        payload: { roomId = null },
      } = action;
      if (roomId && socket.connected) {
        emitSocket.joinRoom(roomId);
      }
      state.roomId = roomId;
    },
    updateConnectionStatus(state, action) {
      const {
        payload: { status = false },
      } = action;
      state.connectionStatus = status;
    },
    onConnect(state, action) {
      state.connectionStatus = true;
      if (state.roomId) {
        emitSocket.joinRoom(state.roomId);
      }
    },
    onDisconnect(state, action) {
      state.connectionStatus = false;
      state.isHost = false;
      state.activeConnections = null;
      state.activity = null;
    },
    updateHost(state, action) {
      const {
        payload: { isHost = false },
      } = action;
      state.isHost = isHost;
    },
    updateConnections(state, action) {
      const {
        payload: { connections = null },
      } = action;
      state.activeConnections = connections;
    },
    updateActivity(state, action) {
      const {
        payload: { type = null, noEmit = false },
      } = action;
      if (type && !noEmit) {
        emitSocket.updateActivity(type, state.roomId);
      }
      state.activity = type;
    },
    // syncApp(state, action) {
    //   if (state.isHost) {
    //     emitSocket.syncUpdateApp(
    //       {
    //         type: state.activity,
    //       },
    //       state.roomId
    //     );
    //   }
    // },
  },
});

/**
 *  Selectors
 */

const selectState = (state) => state[reducerName];

export const selectPlayground = (state) => {
  const {
    playground: {
      connectionStatus,
      isHost,
      activeConnections,
      activity,
      roomId,
    },
  } = state;
  return { connectionStatus, isHost, activeConnections, activity, roomId };
};

export const selectPlaygroundActivity = (state) => {
  const {
    playground: { isHost, activity, roomId },
  } = state;
  return { isHost, activity, roomId };
};

export const selectorPlaygroundActivity = createSelector(selectState, ({ isHost, activity, roomId }) => ({ isHost, activity, roomId }));

const { actions, reducer } = playgroundSlice;
export const {
  reset,
  initialize,
  updateConnectionStatus,
  updateHost,
  updateConnections,
  updateActivity,
  onConnect,
  onDisconnect,
  // syncApp,
} = actions;

export default reducer;

/**
 * Handle Socket
 */

export const onSocket = () => (dispatch) => {

  socket.on("PLAYGROUND_ASSIGN_HOST", ({ host = false }) => {
    dispatch(updateHost({ isHost: host }));
  });

  socket.on("PLAYGROUND_UPDATE_ACTIVITY", ({ type = null }) => {
    dispatch(updateActivity({ type, noEmit: true }));
  });

  socket.on("PLAYGROUND_UPDATE_CONNECTIONS", ({ connections = null }) => {
    dispatch(updateConnections({ connections }));
  });

  socket.on("connect", () => {
    dispatch(onConnect());
  });

  socket.on("disconnect", () => {
    dispatch(onDisconnect());
  });
};

const emitSocket = {
  joinRoom(roomId) {
    socket.emit("PLAYGROUND_JOIN_ROOM", { roomId });
  },
  updateActivity(type, roomId) {
    socket.emit("PLAYGROUND_EMIT_ROOM", { emitType: 'PLAYGROUND_UPDATE_ACTIVITY', type, roomId });
  },
};
