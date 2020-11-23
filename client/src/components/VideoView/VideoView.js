import React, { useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player/youtube";
import socket from "services/socket";
import { useSelector } from "react-redux";

import styles from "./VideoView.module.css";

import {
  activityTypes,
  selectPlaygroundActivity,
} from "components/Playground/playgroundSlice";

const videoIdList = [
  {
    id: "mU5iSwYViM0",
    title: "Code Subway Surfers",
    url: "https://www.youtube.com/watch?v=mU5iSwYViM0",
  },
  {
    id: "2E6mEyxYKl8",
    title: "Diwali Special",
    url: "https://www.youtube.com/watch?v=2E6mEyxYKl8",
  },
  {
    id: "RtTIQhHFvIw",
    title: "Iron Man vs Thanos",
    url: "https://www.youtube.com/watch?v=RtTIQhHFvIw",
  },
];

/**
 * https://developers.google.com/youtube/iframe_api_reference
 */

function VideoView() {
  const [videoUrl, setVideoUrl] = useState(null);
  const playgroundState = useSelector(selectPlaygroundActivity);
  const playerRef = useRef(null);

  const [playerStatePlaying, setPlayerStatePlaying] = useState(true);
  const [playerStateProgress, setPlayerStateProgress] = useState({
    played: 0,
    playedSeconds: 0,
    loaded: 0,
    loadedSeconds: 0,
  });
  const [playerStateSeek, setPlayerStateSeek] = useState(false);

  useEffect(() => {
    socket.on("PLAYGROUND_ACTIVITY_EVENT", handleActivityEvent);
  });

  function handleActivityEvent(e) {
    const { activityType, eventType, payload } = e;

    if (activityType !== activityTypes.video) {
      return;
    }

    if (playgroundState.isHost) {
      return;
    }

    switch (eventType) {
      case "LOAD": {
        const { url } = payload;
        if (url) {
          setVideoUrl(url);
          setPlayerStatePlaying(true);
        }
        break;
      }
      case "PLAY": {
        setPlayerStatePlaying(true);
        break;
      }
      case "PAUSE": {
        setPlayerStatePlaying(false);
        break;
      }
      case "SEEK": {
        const { seekTo = 0 } = payload;
        playerRef.current.seekTo(seekTo);
        break;
      }
      case "END": {
        setPlayerStatePlaying(false);
        setVideoUrl(null);
        break;
      }
      default:
        break;
    }
  }

  const handleSeekMouseDown = (e) => {
    setPlayerStateSeek(true);
  };
  const handleSeekChange = (e) => {
    const seekToValue = parseFloat(e.target.value);
    playerRef.current.seekTo(seekToValue);
    if (playgroundState.isHost && socket) {
      socket.emit("PLAYGROUND_ACTIVITY_EVENT", {
        roomId: playgroundState.roomId,
        activityType: activityTypes.video,
        eventType: "SEEK",
        payload: {
          seekTo: seekToValue,
        },
      });
    }
  };
  const handleSeekMouseUp = (e) => {
    setPlayerStateSeek(false);
  };
  const handleProgress = (e) => {
    if (!playerStateSeek) {
      setPlayerStateProgress(e);
    }
  };
  const handlePlay = (e) => {
    setPlayerStatePlaying(true);
    if (playgroundState.isHost && socket) {
      socket.emit("PLAYGROUND_ACTIVITY_EVENT", {
        roomId: playgroundState.roomId,
        activityType: activityTypes.video,
        eventType: "PLAY",
      });
    }
  };
  const handlePause = (e) => {
    setPlayerStatePlaying(false);

    if (playgroundState.isHost && socket) {
      socket.emit("PLAYGROUND_ACTIVITY_EVENT", {
        roomId: playgroundState.roomId,
        activityType: activityTypes.video,
        eventType: "PAUSE",
      });
    }
  };
  const handleEnded = (e) => {
    setPlayerStatePlaying(false);
    setVideoUrl(null);

    if (playgroundState.isHost && socket) {
      socket.emit("PLAYGROUND_ACTIVITY_EVENT", {
        roomId: playgroundState.roomId,
        activityType: activityTypes.video,
        eventType: "END",
      });
    }
  };
  //   const handleSeek = (e) => {};
  const loadUrl = (url) => {
    setVideoUrl(url);
    setPlayerStatePlaying(true);

    if (playgroundState.isHost && socket) {
      socket.emit("PLAYGROUND_ACTIVITY_EVENT", {
        roomId: playgroundState.roomId,
        activityType: activityTypes.video,
        eventType: "LOAD",
        payload: {
          url,
        },
      });
    }
  };

  return (
    <div className={styles.view_container}>
      {videoUrl === null && playgroundState.isHost && (
        <div className={styles.video_selector_container}>
          {videoIdList.map((videoId) => (
            <div
              key={videoId.id}
              onClick={() => {
                loadUrl(videoId.url);
              }}
            >
              {videoId.title}
            </div>
          ))}
        </div>
      )}

      {videoUrl !== null && (
        <div className={styles.player_container}>
          {playgroundState.isHost && <div className={styles.back_container}>
            <button
              onClick={() => {
                handleEnded();
              }}
            >
              Back to Selection
            </button>
          </div>}
          <div className={styles.video_container}>
            <ReactPlayer
              ref={playerRef}
              playing={playerStatePlaying}
              url={videoUrl}
              onProgress={handleProgress}
              width="100%"
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
            />
          </div>
          {playgroundState.isHost && <div className={styles.controls_container}>
            {playerStatePlaying ? (
              <button onClick={handlePause}>Pause</button>
            ) : (
              <button onClick={handlePlay}>Play</button>
            )}
            <input
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={playerStateProgress.played}
              onMouseDown={handleSeekMouseDown}
              onChange={handleSeekChange}
              onMouseUp={handleSeekMouseUp}
            />
          </div>}
        </div>
      )}
    </div>
  );
}

export default VideoView;
