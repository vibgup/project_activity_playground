import React from "react";
import { Router } from "@reach/router";
import "./App.css";

import Playground from "components/Playground/Playground";

function Home() {
  return (<div>
    <p>Activity Playground</p>
    <p>Please join a room by navigate to <strong>/:room</strong></p>
  </div>);
}

function NotFound() {
  return <div>Oops...</div>;
}

function App() {
  return (
    <Router>
      <Home path="/" />
      <Playground path="/:roomId" />
      <NotFound default />
    </Router>
  );
}

export default App;
