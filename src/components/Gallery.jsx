import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

function Gallery() {
  const [media, setMedia] = useState({ 
    images: [], 
    videos: [], 
    imagesPath: '', 
    videosPath: '' 
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState({});

  const loadMedia = async () => {
    try {
      const response = await invoke('get_media_files');
      setMedia(response);
      if (response.images.length > 0 || response.videos.length > 0) {
        loadPreviews(response.images.concat(response.videos));
      }
      setError(null);
    } catch (err) {
      setError(`Błąd wczytywania mediów: ${err}`);
    }
  };

  const loadPreviews = async (files) => {
    const newPreviews = {};
    for (const file of files) {
      try {
        const content = await invoke('read_file_content', { path: file });
        const blob = new Blob([new Uint8Array(content)]);
        newPreviews[file] = URL.createObjectURL(blob);
      } catch (err) {
        console.error(`Błąd wczytywania podglądu dla ${file}:`, err);
      }
    }
    setPreviews(newPreviews);
  };

  useEffect(() => {
    loadMedia();
    return () => {
      // Cleanup URLs
      Object.values(previews).forEach(URL.revokeObjectURL);
    };
  }, []);

  return (
    <div className="gallery-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="paths-info">
        <p>Katalog zdjęć: {media.imagesPath}</p>
        <p>Katalog wideo: {media.videosPath}</p>
      </div>
      
      <div className="media-sections">
        <div className="section">
          <h3>Zdjęcia</h3>
          {media.images.length === 0 ? (
            <p className="no-media">Brak zdjęć w galerii</p>
          ) : (
            <div className="gallery-grid">
              {media.images.map((image, index) => (
                <div key={`img-${index}`} className="gallery-item" onClick={() => setSelectedItem(image)}>
                  {previews[image] && <img src={previews[image]} alt={`Zdjęcie ${index + 1}`} />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h3>Nagrania</h3>
          {media.videos.length === 0 ? (
            <p className="no-media">Brak nagrań w galerii</p>
          ) : (
            <div className="gallery-grid">
              {media.videos.map((video, index) => (
                <div key={`vid-${index}`} className="gallery-item" onClick={() => setSelectedItem(video)}>
                  {previews[video] && <video src={previews[video]} />}
                  <div className="video-overlay">▶</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="media-modal" onClick={() => setSelectedItem(null)}>
          <div className="modal-content">
            {selectedItem.endsWith('.avi') ? (
              <video src={previews[selectedItem]} controls autoPlay />
            ) : (
              <img src={previews[selectedItem]} alt="Wybrane medium" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery; 