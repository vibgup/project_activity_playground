import React, { useRef, useState, useEffect } from "react";
import styles from "./WhiteboardView.module.css";

const colorList = ["blue", "orangered", "yellow", "blueviolet"];

/**
 * Canvas functionality based on socketio whiteboard example
 * https://github.com/socketio/socket.io/tree/master/examples/whiteboard
 * Offset fixes: https://github.com/RanaEmad/whiteboard
 */

function WhiteboardView(props) {
  const {
    penColor = colorList[0],
    onPenColorUpdate,
    onDraw,
    addSnip,
    reDraw,
  } = props;

  const [drawing, setDrawing] = useState(false);
  const [current, setCurrent] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [ctx, setCtx] = useState({});

  useEffect(() => {
    let canv = canvasRef.current;
    canv.width = containerRef.current.offsetWidth;
    canv.height = containerRef.current.offsetHeight;

    let canvCtx = canv.getContext("2d");
    canvCtx.lineJoin = "round";
    canvCtx.lineCap = "round";
    canvCtx.lineWidth = 5;
    setCtx(canvCtx);

    let offset = canv.getBoundingClientRect();
    setCanvasOffset({ x: parseInt(offset.left), y: parseInt(offset.top) });
  }, [ctx]);

  function drawLine(x0, y0, x1, y1, color, emit) {

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    if (!emit) { return; }
    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;

    if (onDraw) {
      onDraw('drawing', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color
      });  
    }
  }

  function getCoordinates(e) {
    const client_x = e?.clientX ?? (e?.touches ? 0.0?.clientX : 0);
    const client_y = e?.clientY ?? (e?.touches ? 0.0?.clientY : 0);
    const updated_x = client_x - canvasOffset.x;
    const updated_y = client_y - canvasOffset.y;
    // console.log({
    //   updated_x,
    //   updated_y,
    // });
    return {
      x: updated_x,
      y: updated_y,
    };
  }

  function onMouseDown(e) {
    setDrawing(true);
    const updated_coordinates = getCoordinates(e);
    setCurrent(updated_coordinates);
  }

  function onMouseUp(e) {
    if (!drawing) {
      return;
    }
    setDrawing(false);
    const updated_coordinates = getCoordinates(e);
    drawLine(
      current.x,
      current.y,
      updated_coordinates.x,
      updated_coordinates.y,
      penColor,
      true
    );
    setCurrent({ x: 0, y: 0 });
  }

  function onMouseMove(e) {
    if (!drawing) {
      return;
    }
    const updated_coordinates = getCoordinates(e);
    drawLine(
      current.x,
      current.y,
      updated_coordinates.x,
      updated_coordinates.y,
      penColor,
      true
    );
    setCurrent(updated_coordinates);
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
      var time = new Date().getTime();

      if (time - previousCall >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data){
    const canvas = canvasRef.current;
    const w = canvas.width;
    const h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, false);
  }

  return (
    <div className={styles.board_container}>
      <div className={styles.board} ref={containerRef}>
        <canvas
          className={styles.canvas}
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseOut={onMouseUp}
          onMouseMove={throttle(onMouseMove, 10)}
          onTouchStart={onMouseDown}
          onTouchEnd={onMouseUp}
          onTouchCancel={onMouseUp}
          onTouchMove={throttle(onMouseMove, 10)}
        />
      </div>
      <div className={styles.color_container}>
        {colorList.map((color) =>
          color === penColor ? (
            <div
              key={color}
              className={`${styles.color} ${styles["color-active"]} ${
                styles[`color-${color}`]
              }`}
            />
          ) : (
            <div
              key={color}
              className={`${styles.color} ${styles[`color-${color}`]}`}
              onClick={() => {
                onPenColorUpdate(color);
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

export default WhiteboardView;
