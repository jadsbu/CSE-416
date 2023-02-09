import React, { ChangeEvent, useState, useEffect } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';

const Upload = () => {

    const [selectedFiles, setSelectedFiles] = useState();
    const [isFilePicked, setIsFilePicked] = useState(false);

    const chooseFileHandler = (event) => {
        const fileReader = new FileReader();
        fileReader.readAsText(event.target.files[0], "UTF-8");
        fileReader.onload = event => {
            setSelectedFiles(JSON.parse(event.target.result));
        };
    }

    const handleSubmission = () => {
        console.log('Submitting File: ', selectedFiles);
        setIsFilePicked(true);
    }

    const editCountryName = (event) => {
        console.log('CLICKED')
        //make pop up to change name in json and then send to rerender
    }

    const onEachCountry = (feature, layer) => {
        console.log(feature.properties.admin)
        const countryName = feature.properties.admin
        layer.bindPopup(countryName)
        layer.on({
            click: editCountryName
        })
    }

    return (
        <div>
            <div>
                <input type='file' name='file' multiple onChange={chooseFileHandler}></input>
            </div>
            <br></br>
            <div>
                <button onClick={handleSubmission}>Submit</button>
            </div>
            <div id='viewport'>
                <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom={true}>
                    {isFilePicked ? < GeoJSON data={selectedFiles.features} onEachFeature={onEachCountry}></GeoJSON> : <></>}
                </MapContainer>

            </div>

        </div >
    );
};
export default Upload