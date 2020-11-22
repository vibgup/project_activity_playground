import React from "react";
import { useParams } from "@reach/router";

import WhiteboardView from "components/WhiteboardView/WhiteboardView";

function Playground() {
  const params = useParams();
  return (
    <div>
      <div>Playground Room ID: {params.roomId}</div>
      <WhiteboardView />
    </div>
  );
}

export default Playground;
