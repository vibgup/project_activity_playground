import React from "react";
import { Router } from "@reach/router";
import "./App.css";

import Playground from "containers/Playground/Playground";

function Home() {
  return <div>HOME</div>;
}

function App() {
  return (
    <Router>
      <Home path="/" />
      <Playground path="playground/:roomId" />
      <Home default />
    </Router>
  );
}

export default App;
