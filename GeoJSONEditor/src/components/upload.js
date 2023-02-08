import React, { ChangeEvent, useState, useEffect } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';

const Upload = () => {

    const [selectedFiles, setSelectedFiles] = useState();
    const [isFilePicked, setIsFilePicked] = useState(false);
    useEffect( () => {
        console.log('useEffect ', isFilePicked);
    }, [isFilePicked]);


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
                <MapContainer center={[0, 0]}zoom={2} scrollWheelZoom={true}>
                    {isFilePicked ? < GeoJSON data={selectedFiles.features}></GeoJSON> : <></>}


                </MapContainer>

            </div>

        </div >
    );
};
export default Upload