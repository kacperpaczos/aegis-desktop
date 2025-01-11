// src/components/FaceTraining.jsx
import { useState } from 'react';
import { profileApi } from '../api/profileApi';
import '../styles/FaceTraining.css';

export default function FaceTraining({ profileId, onComplete, onError }) {
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState(null);

  const handleStartTraining = async () => {
    try {
      setIsTraining(true);
      setError(null);

      await profileApi.trainFaceModel();
      onComplete?.();
      
    } catch (err) {
      console.error('Błąd trenowania:', err);
      const errorMsg = err.message.includes('video_path') 
        ? 'Brak nagrania wideo do trenowania. Najpierw nagraj wideo treningowe.'
        : `Błąd: ${err.message}`;
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="form-group face-training">
      <h3>Trenowanie rozpoznawania twarzy</h3>
      <p>
        Naciśnij przycisk, aby rozpocząć proces trenowania modelu rozpoznawania twarzy.
      </p>
      
      <button 
        onClick={handleStartTraining}
        disabled={isTraining}
        className="training-button"
      >
        {isTraining ? 'Trwa trenowanie...' : 'Rozpocznij trenowanie'}
      </button>

      {error && <div className="error">{error}</div>}
    </div>
  );
}