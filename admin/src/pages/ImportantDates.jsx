import React, { useState } from 'react';

const ImportantDates = () => {
  const [uploadedPhoto, setUploadedPhoto] = useState(null);

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedPhoto(e.target.result); // Set the photo data URL for preview
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid photo file.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Important Dates</h1>
      <input
        type="file"
        accept="image/*" // Restricts file input to image types
        onChange={handlePhotoUpload}
        style={{ marginTop: '10px', padding: '5px' }}
      />
      {uploadedPhoto && (
        <div style={{ marginTop: '20px' }}>
          <h2>Uploaded Photo:</h2>
          <img
            src={uploadedPhoto}
            alt="Uploaded Preview"
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImportantDates;