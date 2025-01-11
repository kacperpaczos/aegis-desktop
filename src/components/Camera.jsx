import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

function Camera() {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [lastSavedPath, setLastSavedPath] = useState(null);

  const takePhoto = async () => {
    try {
      const response = await invoke('take_photo');
      if (response.status === 'success') {
        setLastSavedPath(response.path);
        setError(null);
      } else {
        setError(response.message || 'Błąd podczas robienia zdjęcia');
      }
    } catch (err) {
      setError(`Błąd: ${err}`);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const response = await invoke('record_video', { duration: 5 });
      if (response.status === 'success') {
        setLastSavedPath(response.path);
        setError(null);
      } else {
        setError(response.message || 'Błąd podczas nagrywania');
      }
    } catch (err) {
      setError(`Błąd: ${err}`);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="camera-container">
      {error && <div className="error-message">{error}</div>}
      {lastSavedPath && (
        <div className="success-message">
          Zapisano w: {lastSavedPath}
        </div>
      )}
      <div className="camera-controls">
        <button 
          onClick={takePhoto}
          disabled={isRecording}
        >
          Zrób Zdjęcie
        </button>
        <button 
          onClick={startRecording}
          disabled={isRecording}
        >
          {isRecording ? 'Nagrywanie...' : 'Nagraj Film (5s)'}
        </button>
      </div>
    </div>
  );
}

export default Camera; 