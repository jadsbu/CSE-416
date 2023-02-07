import React, { ChangeEvent, useState } from 'react';

const Upload = () => {

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isFilePicked, setIsFilePicked] = useState(false);


    const chooseFileHandler = (event) => {
        const selectedFiles = Array.prototype.slice.call(event.target.files);
        setSelectedFiles(selectedFiles);
        console.log('SELECTED ', selectedFiles);
    }

    const handleSubmission = () => {
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

        </div>
    );
};
export default Upload