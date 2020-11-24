import React, { PureComponent, createRef } from "react";
import socket from "services/socket";
import { connect } from "react-redux";

import styles from "./WhiteboardView.module.css";

import {
  activityTypes,
  selectorPlaygroundActivity,
} from "components/Playground/playgroundSlice";

const colorList = ["blue", "orangered", "yellow", "blueviolet"];

/**
 * Canvas functionality based on socketio whiteboard example
 * https://github.com/socketio/socket.io/tree/master/examples/whiteboard
 * Offset fixes: https://github.com/RanaEmad/whiteboard
 */

class WhiteboardView extends PureComponent {
  constructor(props){
    super(props);
    this.state = {
      penColor: colorList[0],
      drawing: false,
      current: { x: 0, y: 0 },
      canvasOffset: { x: 0, y: 0 },
      canvasDimension: { w: 0, h: 0 },
      ctx: {},
    };

    this.canvasRef = createRef();
    this.containerRef = createRef();

    this.handleActivityEvent = this.handleActivityEvent.bind(this);
    this.drawLine = this.drawLine.bind(this);
    this.getCoordinates = this.getCoordinates.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.throttle = this.throttle.bind(this);
    this.onDrawingEvent = this.onDrawingEvent.bind(this);
    this.updateCanvasContext = this.updateCanvasContext.bind(this);
    // this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.updateCanvasContext();
    socket.on("PLAYGROUND_ACTIVITY_EVENT", this.handleActivityEvent);

    // window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    // window.removeEventListener('resize', this.handleResize);
  }

  // handleResize() {
  //   this.updateCanvasContext();
  // }

  updateCanvasContext() {
    let canv = this.canvasRef.current;
    const canvas_w = (canv.width = this.containerRef.current.offsetWidth);
    const canvas_h = (canv.height = this.containerRef.current.offsetHeight);

    let canvCtx = canv.getContext("2d");
    canvCtx.lineJoin = "round";
    canvCtx.lineCap = "round";
    canvCtx.lineWidth = 5;

    let offset = canv.getBoundingClientRect();
    
    this.setState({
      ctx: canvCtx,
      canvasDimension: { w: canvas_w, h: canvas_h },
      canvasOffset: { x: parseInt(offset.left), y: parseInt(offset.top) },
    })

  }

  handleActivityEvent(e) {
    const { activityType, eventType, payload } = e;

    if (!activityType || !eventType || !payload) {
      return;
    }

    if (activityType !== activityTypes.whiteboard) {
      return;
    }

    if (eventType === "DRAW") {
      this.onDrawingEvent(payload);
    }
  }

  drawLine(x0, y0, x1, y1, color, emit) {

    // if(!ctx) return;

    // console.log('drawLine', {x0, y0, x1, y1, color, emit});

    const ctx = this.state.ctx;

    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    if (!emit) {
      return;
    }

    const { w, h } = this.state.canvasDimension;
    if (socket) {
      socket.emit("PLAYGROUND_EMIT_ROOM", {
        emitType: 'PLAYGROUND_ACTIVITY_EVENT',
        roomId: this.props.playgroundState.roomId,
        activityType: activityTypes.whiteboard,
        eventType: "DRAW",
        payload: {
          x0: x0 / w,
          y0: y0 / h,
          x1: x1 / w,
          y1: y1 / h,
          color: color,
        },
      });
    }
  }

  getCoordinates(e) {
    const client_x = e?.clientX ?? (e?.touches ? 0.0?.clientX : 0);
    const client_y = e?.clientY ?? (e?.touches ? 0.0?.clientY : 0);
    const updated_x = client_x - this.state.canvasOffset.x;
    const updated_y = client_y - this.state.canvasOffset.y;
    return {
      x: updated_x,
      y: updated_y,
    };
  }

  onMouseDown(e) {
    const updated_coordinates = this.getCoordinates(e);
    this.setState({
      drawing: true,
      current: updated_coordinates,
    })
  }

  onMouseUp(e) {
    if (!this.state.drawing) {
      return;
    }
    const updated_coordinates = this.getCoordinates(e);
    const {current, penColor} = this.state;
    this.drawLine(
      current.x,
      current.y,
      updated_coordinates.x,
      updated_coordinates.y,
      penColor,
      true
    );
    this.setState({
      drawing: false,
      current: { x: 0, y: 0 },
    });
  }

  onMouseMove(e) {
    if (!this.state.drawing) {
      return;
    }
    const updated_coordinates = this.getCoordinates(e);
    const {current, penColor} = this.state;
    this.drawLine(
      current.x,
      current.y,
      updated_coordinates.x,
      updated_coordinates.y,
      penColor,
      true
    );
    this.setState({
      current: updated_coordinates,
    });
  }

  // limit the number of events per second
  throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
      var time = new Date().getTime();

      if (time - previousCall >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  onDrawingEvent(data) {
    const { w, h } = this.state.canvasDimension;
    this.drawLine(
      data.x0 * w,
      data.y0 * h,
      data.x1 * w,
      data.y1 * h,
      data.color,
      false
    );
  }

  render() {
    const { penColor } = this.state;
    return (
      <div className={styles.board_container}>
        <div className={styles.board} ref={this.containerRef}>
          <canvas
            className={styles.canvas}
            ref={this.canvasRef}
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            onMouseOut={this.onMouseUp}
            onMouseMove={this.throttle(this.onMouseMove, 10)}
            onTouchStart={this.onMouseDown}
            onTouchEnd={this.onMouseUp}
            onTouchCancel={this.onMouseUp}
            onTouchMove={this.throttle(this.onMouseMove, 10)}
          />
        </div>
        <div className={styles.color_container}>
          {colorList.map((color) =>
            color === penColor ? (
              <div
                key={color}
                className={`${styles.color} ${styles.color_active} ${
                  styles[`color_${color}`]
                }`}
              />
            ) : (
              <div
                key={color}
                className={`${styles.color} ${styles[`color_${color}`]}`}
                onClick={() => {
                  this.setState({penColor: color});
                }}
              />
            )
          )}
        </div>
      </div>
    );
  }

}

const mapStateToProps = state => {
  return {
    playgroundState: selectorPlaygroundActivity(state)
  };
}

const mapDispatchToProps = dispatch => {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(WhiteboardView);

// function WhiteboardViewHk() {

//   const [penColor, setPenColor] = useState(colorList[0]);
//   const [drawing, setDrawing] = useState(false);
//   const [current, setCurrent] = useState({ x: 0, y: 0 });
//   const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
//   const [canvasDimension, setCanvasDimension] = useState({ w: 0, h: 0 });
//   const canvasRef = useRef(null);
//   const containerRef = useRef(null);
//   const [ctx, setCtx] = useState({});
//   const playgroundState = useSelector(selectPlaygroundActivity);

//   useEffect(() => {
//     socket.on("PLAYGROUND_ACTIVITY_EVENT", handleActivityEvent);
//   });

//   useEffect(() => {
//     let canv = canvasRef.current;
//     const canvas_w = (canv.width = containerRef.current.offsetWidth);
//     const canvas_h = (canv.height = containerRef.current.offsetHeight);

//     setCanvasDimension({ w: canvas_w, h: canvas_h });

//     let canvCtx = canv.getContext("2d");
//     canvCtx.lineJoin = "round";
//     canvCtx.lineCap = "round";
//     canvCtx.lineWidth = 5;
//     setCtx(canvCtx);

//     let offset = canv.getBoundingClientRect();
//     setCanvasOffset({ x: parseInt(offset.left), y: parseInt(offset.top) });
//   }, [ctx]);

//   function handleActivityEvent(e) {
//     const { activityType, eventType, payload } = e;

//     if (!activityType || !eventType || !payload) {
//       return;
//     }

//     if (activityType !== activityTypes.whiteboard) {
//       return;
//     }

//     if (eventType === "DRAW") {
//       onDrawingEvent(payload);
//     }
//   }

//   function drawLine(x0, y0, x1, y1, color, emit) {

//     if(!ctx) return;

//     // console.log('drawLine', ctx, {x0, y0, x1, y1, color, emit});

//     ctx.strokeStyle = color;
//     ctx.beginPath();
//     ctx.moveTo(x0, y0);
//     ctx.lineTo(x1, y1);
//     ctx.lineWidth = 2;
//     ctx.stroke();
//     ctx.closePath();

//     if (!emit) {
//       return;
//     }

//     const { w, h } = canvasDimension;
//     if (socket) {
//       socket.emit("PLAYGROUND_EMIT_ROOM", {
//         emitType: 'PLAYGROUND_ACTIVITY_EVENT',
//         roomId: playgroundState.roomId,
//         activityType: activityTypes.whiteboard,
//         eventType: "DRAW",
//         payload: {
//           x0: x0 / w,
//           y0: y0 / h,
//           x1: x1 / w,
//           y1: y1 / h,
//           color: color,
//         },
//       });
//     }
//   }

//   function getCoordinates(e) {
//     const client_x = e?.clientX ?? (e?.touches ? 0.0?.clientX : 0);
//     const client_y = e?.clientY ?? (e?.touches ? 0.0?.clientY : 0);
//     const updated_x = client_x - canvasOffset.x;
//     const updated_y = client_y - canvasOffset.y;
//     return {
//       x: updated_x,
//       y: updated_y,
//     };
//   }

//   function onMouseDown(e) {
//     setDrawing(true);
//     const updated_coordinates = getCoordinates(e);
//     setCurrent(updated_coordinates);
//   }

//   function onMouseUp(e) {
//     if (!drawing) {
//       return;
//     }
//     setDrawing(false);
//     const updated_coordinates = getCoordinates(e);
//     drawLine(
//       current.x,
//       current.y,
//       updated_coordinates.x,
//       updated_coordinates.y,
//       penColor,
//       true
//     );
//     setCurrent({ x: 0, y: 0 });
//   }

//   function onMouseMove(e) {
//     if (!drawing) {
//       return;
//     }
//     const updated_coordinates = getCoordinates(e);
//     drawLine(
//       current.x,
//       current.y,
//       updated_coordinates.x,
//       updated_coordinates.y,
//       penColor,
//       true
//     );
//     setCurrent(updated_coordinates);
//   }

//   // limit the number of events per second
//   function throttle(callback, delay) {
//     var previousCall = new Date().getTime();
//     return function () {
//       var time = new Date().getTime();

//       if (time - previousCall >= delay) {
//         previousCall = time;
//         callback.apply(null, arguments);
//       }
//     };
//   }

//   function onDrawingEvent(data) {
//     const { w, h } = canvasDimension;
//     drawLine(
//       data.x0 * w,
//       data.y0 * h,
//       data.x1 * w,
//       data.y1 * h,
//       data.color,
//       false
//     );
//   }

//   return (
//     <div className={styles.board_container}>
//       <div className={styles.board} ref={containerRef}>
//         <canvas
//           className={styles.canvas}
//           ref={canvasRef}
//           onMouseDown={onMouseDown}
//           onMouseUp={onMouseUp}
//           onMouseOut={onMouseUp}
//           onMouseMove={throttle(onMouseMove, 10)}
//           onTouchStart={onMouseDown}
//           onTouchEnd={onMouseUp}
//           onTouchCancel={onMouseUp}
//           onTouchMove={throttle(onMouseMove, 10)}
//         />
//       </div>
//       <div className={styles.color_container}>
//         {colorList.map((color) =>
//           color === penColor ? (
//             <div
//               key={color}
//               className={`${styles.color} ${styles.color_active} ${
//                 styles[`color_${color}`]
//               }`}
//             />
//           ) : (
//             <div
//               key={color}
//               className={`${styles.color} ${styles[`color_${color}`]}`}
//               onClick={() => {
//                 setPenColor(color);
//               }}
//             />
//           )
//         )}
//       </div>
//     </div>
//   );
// }

// export default WhiteboardView;
