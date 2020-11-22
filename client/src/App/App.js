import React from 'react';
// import logo from 'logo.svg';
// import { Counter } from 'features/counter/Counter';
import './App.css';
import { Router, useParams } from "@reach/router"

function Playground() {
  const params = useParams();
return <div>Playground Room ID: {params.roomId}</div>;
};

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
