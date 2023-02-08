import './App.css';
import 'leaflet/dist/leaflet.css';
import Upload from './components/upload';


function App() {
  return (
    <div>
      <div>
        GeoJSON Editor
      </div>
      <br></br>
      <Upload></Upload>
    </div>
  );
}

export default App;
