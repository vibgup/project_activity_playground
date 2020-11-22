import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  reset,
  initialize,
  // updateConnectionStatus,
  // updateHost,
  // updateConnections,
  updateActivity,
  selectPlayground,
  onSocket,
  activityTypes,
} from "./playgroundSlice";
import styles from "./Playground.module.css";

import WhiteboardView from "components/WhiteboardView/WhiteboardView";
import VideoView from "components/VideoView/VideoView";

function Playground({ roomId }) {
  const state = useSelector(selectPlayground);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(onSocket());
    return () => {
      dispatch(reset());
    };
  }, []);

  useEffect(() => {
    dispatch(initialize(roomId));
  }, [roomId]);

  console.log(state);

  return (
    <div className={styles.playground_container}>
      <div className={styles.playground_header}>
        <div className={styles.playground_info}>
          <div># of connections:</div>
          <div>You are the HOST</div>
        </div>        
        <div className={styles.playground_activity}>
          <div          
            onClick={() => {
              dispatch(updateActivity({type: activityTypes.whiteboard}));
            }}
            className={
              state.activity === activityTypes.whiteboard
                ? styles.activity_action_active
                : styles.activity_action
            }
          >
            Whiteboard
          </div>
          <div
            onClick={() => {
              dispatch(updateActivity({type: activityTypes.video}));
            }}
            className={
              state.activity === activityTypes.video
                ? styles.activity_action_active
                : styles.activity_action
            }
          >
            Video Player
          </div>
        </div>
      </div>
      <div className={styles.activity_container}>
        <VideoView />
        <WhiteboardView />
      </div>
    </div>
  );
}

export default Playground;
