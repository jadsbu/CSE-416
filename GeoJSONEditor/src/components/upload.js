import React, { ChangeEvent, useState, useEffect } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'reactjs-popup/dist/index.css';
import 'leaflet/dist/leaflet.css';

// npm install reactjs-popup --save

const Upload = () => {

    const [selectedFiles, setSelectedFiles] = useState();
    const [isFilePicked, setIsFilePicked] = useState(false);
    const [countryName, setCountryName] = useState();
    const [popup, setPopup] = useState(false);
    const [newName, setNewName] = useState("");

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

    //newfile = JSON.parse(JSON.stringify(newfile).replaceAll(countryName, newName))

    const editCountryName = (event) => {
        
        //make pop up to change name in json and then send to rerender
        var newfile = JSON.parse(JSON.stringify(selectedFiles))
        
        for(var i = 0; i < newfile.features.length; i++){
            if(newfile.features[i].properties.admin == countryName){
                newfile.features[i].properties.admin = newName
            }
        }
        setSelectedFiles(newfile)
        setCountryName(newName)
        console.log(newfile)
        handleSubmission();
        setPopup(true);

    

    }
        // layer.on({
        //     click: setPopup(true)
        // })
    const changeNewName = (event) => {
        setNewName(event.target.value)
    }

    const changeCountryName = (e) => {
        setCountryName(e);
    }

    const onEachCountry = (feature, layer) => {
        console.log(feature.properties.admin)
        const countryName = feature.properties.admin
        layer.bindPopup(countryName)
        layer.on({
            click: () => {
                changeCountryName(countryName)
            }
        })
    }

    const handlePopup = () => {
        setPopup(false);
    }

    if(popup){
        return(
            <>
                <p> Country name has been changed to: {countryName}!</p>
                <button onClick={handlePopup}> Go home </button>
            </>
        );
    } else {
    return (
        <div>
            <div>
                <input type='file' name='file' multiple onChange={chooseFileHandler}></input>
            </div>
            <br></br>
            <div>
                <button onClick={handleSubmission}>Submit</button>
            </div>
            <p> Country is: {countryName} </p>
                <form>
                    <span>Change Country Name: </span><input type='text' name='countryName' onChange = {changeNewName}></input>
                    <button onClick = {editCountryName}>Submit</button>
                </form>
            <div id='viewport'>
                <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom={true}>
                    {isFilePicked ? < GeoJSON data={selectedFiles.features} onEachFeature={onEachCountry}></GeoJSON> : <></>}
                </MapContainer>

            </div>

        </div >
    );
};
}

export default Upload