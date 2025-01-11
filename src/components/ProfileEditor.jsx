import { useState, useEffect } from 'react';
import { FaUser, FaCamera, FaTrash } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/core';
import useProfileStore from '../store/profileStore';
import { backgroundOptions, iconComponents } from '../config/profileConfig';
import '../styles/ProfileEditor.css';
import FaceTraining from './FaceTraining';

function ProfileEditor({ profile, onSave, onCancel, showNotification }) {
  const [name, setName] = useState(profile?.name || '');
  const [pin, setPin] = useState(profile?.pin || '');
  const [confirmPin, setConfirmPin] = useState(profile?.pin || '');
  const [selectedIcon, setSelectedIcon] = useState(profile?.avatar || 'FaUser');
  const [selectedBackground, setSelectedBackground] = useState(profile?.background || 'gradient1');
  const [customAvatar, setCustomAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState(null);
  const [mediaPath, setMediaPath] = useState('');

  useEffect(() => {
    // Pobierz ścieżkę do katalogu mediów z backendu
    const getMediaPath = async () => {
      try {
        const response = await invoke('get_media_files');
        setMediaPath(response.imagesPath);
      } catch (err) {
        console.error('Błąd pobierania ścieżki mediów:', err);
      }
    };
    getMediaPath();
  }, []);

  const defaultIcons = Object.entries(iconComponents).map(([name, component]) => ({
    name,
    component
  }));

  const loadAvatarPreview = async (path) => {
    try {
      const content = await invoke('read_file_content', { 
        path: path.startsWith('/') ? path : `${mediaPath}/${path}`
      });
      const blob = new Blob([new Uint8Array(content)]);
      const previewUrl = URL.createObjectURL(blob);
      setAvatarPreview(previewUrl);
    } catch (err) {
      console.error('Błąd wczytywania podglądu avatara:', err);
      setError('Nie udało się wczytać podglądu zdjęcia');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const response = await invoke('take_photo');
      if (response.status === 'success') {
        const mediaResponse = await invoke('get_media_files');
        const fullPath = response.path.startsWith('/') 
          ? response.path 
          : `${mediaResponse.imagesPath}/${response.path}`;
        
        setCustomAvatar(fullPath);
        setSelectedIcon(null);
        await loadAvatarPreview(fullPath);
        setError(null);
      } else {
        setError(response.message || 'Błąd podczas robienia zdjęcia');
      }
    } catch (err) {
      console.error('Błąd podczas robienia zdjęcia:', err);
      setError(`Błąd: ${err}`);
    }
  };

  // Czyszczenie URL-i przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, []);

  useEffect(() => {
    if (profile?.avatar && profile.avatar.startsWith('/')) {
      loadAvatarPreview(profile.avatar);
    }
  }, [profile]);

  const handleSelectIcon = (iconName) => {
    if (customAvatar) {
      handleRemoveAvatar();
    }
    setSelectedIcon(iconName);
  };

  const handleSelectBackground = (bgId) => {
    if (customAvatar) {
      handleRemoveAvatar();
    }
    setSelectedBackground(bgId);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Nazwa profilu jest wymagana');
      return;
    }

    if (pin && pin !== confirmPin) {
      setError('PINy nie są zgodne');
      return;
    }

    try {
      const profileData = {
        id: profile?.id,
        name: name.trim(),
        pin: pin || null,
        avatar: customAvatar || selectedIcon,
        background: selectedBackground,
        photos: profile?.photos || [],
        videos: profile?.videos || [],
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: profile ? new Date().toISOString() : null
      };

      await onSave(profileData);
    } catch (err) {
      setError(err.message);
    }
  };

  const renderAvatar = () => {
    if (profile?.avatar && !profile.avatar.startsWith('Fa')) {
      return avatarPreview ? (
        <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <FaUser size={80} />
      );
    } else if (customAvatar && avatarPreview) {
      return <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    } else if (selectedIcon) {
      const IconComponent = iconComponents[selectedIcon];
      return IconComponent ? <IconComponent size={80} /> : <FaUser size={80} />;
    }
    return <FaUser size={80} />;
  };

  const handleRemoveAvatar = () => {
    setCustomAvatar(null);
    setSelectedIcon('FaUser');
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  };

  return (
    <div className="profile-editor">
      <h2>{profile ? 'Edycja Profilu' : 'Nowy Profil'}</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="avatar-section">
        <div className="avatar-preview" style={{ 
          background: backgroundOptions.find(bg => bg.id === selectedBackground)?.style 
        }}>
          {renderAvatar()}
        </div>
        
        <div className="avatar-options">
          {!customAvatar && (
            <>
              <div className="default-avatars">
                {defaultIcons.map((icon) => (
                  <div 
                    key={icon.name}
                    className={`default-avatar ${selectedIcon === icon.name ? 'selected' : ''}`}
                    onClick={() => handleSelectIcon(icon.name)}
                  >
                    <icon.component size={30} />
                  </div>
                ))}
              </div>

              <div className="background-options">
                {backgroundOptions.map((bg) => (
                  <div
                    key={bg.id}
                    className={`background-option ${selectedBackground === bg.id ? 'selected' : ''}`}
                    style={{ background: bg.style }}
                    onClick={() => handleSelectBackground(bg.id)}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="avatar-actions">
            <button className="photo-button" onClick={handleTakePhoto}>
              <FaCamera /> {customAvatar ? 'Zmień zdjęcie' : 'Zrób zdjęcie'}
            </button>
            {customAvatar && (
              <button onClick={handleRemoveAvatar} className="remove-avatar">
                <FaTrash /> Usuń zdjęcie
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Nazwa:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wprowadź nazwę profilu"
        />
      </div>

      <div className="form-group">
        <label>PIN (opcjonalnie):</label>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Ustaw PIN"
          maxLength={4}
        />
        {pin && (
          <input
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            placeholder="Potwierdź PIN"
            maxLength={4}
          />
        )}
      </div>

      <FaceTraining 
        profileId={profile?.id}
        onComplete={() => {
          setError(null);
          showNotification('Model został wytrenowany pomyślnie', 'success');
        }}
        onError={(errorMessage) => {
          setError(errorMessage);
          showNotification(errorMessage, 'error');
        }}
      />

      <div className="editor-controls">
        <button onClick={handleSave} className="save-button">Zapisz</button>
        <button onClick={onCancel} className="cancel-button">Anuluj</button>
      </div>
    </div>
  );
}

export default ProfileEditor; 