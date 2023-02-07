import './App.css';
import React, { useState } from 'react';
import Upload from './components/upload';
import Viewport from './components/viewport';
import 'leaflet/dist/leaflet.css';

function App() {


  return (
    <div>
      <div>
        Shapefile Editor
      </div>
      <br></br>
      <Upload></Upload>
      <br></br>
      <Viewport></Viewport>
    </div>
  );
}

export default App;
