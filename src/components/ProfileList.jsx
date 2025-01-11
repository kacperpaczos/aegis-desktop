import { useState, useEffect } from 'react';
import { FaUser, FaTrash, FaEdit, FaLock, FaUserPlus } from 'react-icons/fa';
import { invoke } from '@tauri-apps/api/core';
import useProfileStore from '../store/profileStore';
import { backgroundOptions, iconComponents } from '../config/profileConfig';
import '../styles/ProfileList.css';

function ProfileList({ onCreateProfile, onEditProfile }) {
  const { profiles, deleteProfile } = useProfileStore();
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [avatarPreviews, setAvatarPreviews] = useState({});
  const [pinInputRef, setPinInputRef] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const loadPreviews = async () => {
      try {
        // Najpierw pobierz ścieżki z backendu
        const mediaResponse = await invoke('get_media_files');
        
        // Następnie wczytaj podglądy dla każdego profilu
        for (const profile of profiles) {
          if (profile.avatar && !profile.avatar.startsWith('Fa')) {
            try {
              const content = await invoke('read_file_content', { 
                path: profile.avatar.startsWith('/') ? profile.avatar : `${mediaResponse.imagesPath}/${profile.avatar}`
              });
              const blob = new Blob([new Uint8Array(content)]);
              const previewUrl = URL.createObjectURL(blob);
              setAvatarPreviews(prev => ({
                ...prev,
                [profile.id]: previewUrl
              }));
            } catch (err) {
              console.error(`Błąd wczytywania avatara dla ${profile.name}:`, err);
            }
          }
        }
      } catch (err) {
        console.error('Błąd pobierania ścieżek mediów:', err);
      }
    };

    loadPreviews();
    return () => {
      Object.values(avatarPreviews).forEach(URL.revokeObjectURL);
    };
  }, [profiles]);

  useEffect(() => {
    if (pinInputRef) {
      pinInputRef.focus();
    }
  }, [selectedProfile]);

  const renderAvatar = (profile) => {
    if (profile.avatar) {
      if (!profile.avatar.startsWith('Fa')) {
        return avatarPreviews[profile.id] ? (
          <img 
            src={avatarPreviews[profile.id]} 
            alt={profile.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <FaUser size={40} />
        );
      } else {
        const IconComponent = iconComponents[profile.avatar];
        return IconComponent ? <IconComponent size={40} /> : <FaUser size={40} />;
      }
    }
    return <FaUser size={40} />;
  };

  if (profiles.length === 0) {
    return (
      <div className="empty-profiles">
        <FaUserPlus size={50} />
        <h2>Brak profili</h2>
        <p>Dodaj swój pierwszy profil</p>
        <button className="create-profile-button" onClick={onCreateProfile}>
          Utwórz profil
        </button>
      </div>
    );
  }

  const handleDelete = (e, id) => {
    e.stopPropagation();
    const profile = profiles.find(p => p.id === id);
    
    if (profile.pin) {
      setSelectedProfile(profile);
      setDeleteId(id);
      setError('');
      setPinInput('');
    } else if (window.confirm('Czy na pewno chcesz usunąć ten profil?')) {
      deleteProfile(id);
    }
  };

  const handleProfileClick = (profile) => {
    if (profile.pin) {
      setSelectedProfile(profile);
      setError('');
      setPinInput('');
    } else {
      onEditProfile(profile);
    }
  };

  const handlePinSubmit = (e, profile) => {
    e.preventDefault();
    verifyPin(profile);
  };

  const verifyPin = (profile) => {
    if (pinInput === profile.pin) {
      setPinInput('');
      setSelectedProfile(null);
      
      if (deleteId) {
        deleteProfile(deleteId);
        setDeleteId(null);
      } else {
        onEditProfile(profile);
      }
    } else {
      setError('Nieprawidłowy PIN');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('pin-input-overlay')) {
      setPinInput('');
      setSelectedProfile(null);
      setDeleteId(null);
      setError('');
    }
  };

  return (
    <div className="profiles-container">
      <h2>Profile</h2>
      <div className="profiles-grid">
        {profiles.map(profile => (
          <div 
            key={profile.id} 
            className="profile-card"
            onClick={() => handleProfileClick(profile)}
          >
            <div className="profile-image" style={{ 
              background: backgroundOptions.find(bg => bg.id === profile.background)?.style 
            }}>
              {renderAvatar(profile)}
            </div>
            <h3>{profile.name}</h3>
            {profile.pin && <FaLock className="pin-icon" />}
            <div className="profile-actions">
              <FaEdit className="edit-icon" />
              <FaTrash 
                className="delete-icon" 
                onClick={(e) => handleDelete(e, profile.id)} 
              />
            </div>
            {selectedProfile?.id === profile.id && (
              <form 
                className="pin-input-overlay" 
                onClick={handleOverlayClick}
                onSubmit={(e) => handlePinSubmit(e, selectedProfile)}
              >
                <input
                  ref={setPinInputRef}
                  type="password"
                  value={pinInput}
                  onChange={e => setPinInput(e.target.value)}
                  placeholder={deleteId ? "Wprowadź PIN aby usunąć" : "Wprowadź PIN"}
                  maxLength={4}
                  className="pin-input-field"
                  autoFocus
                />
                <button type="submit">{deleteId ? 'Usuń' : 'OK'}</button>
                {error && <div className="error-message">{error}</div>}
              </form>
            )}
          </div>
        ))}
        <div className="profile-card add-profile" onClick={onCreateProfile}>
          <div className="add-icon">+</div>
          <span>Dodaj profil</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileList; 