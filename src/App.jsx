import { useState, useEffect } from "react";
import ProfileList from "./components/ProfileList";
import ProfileEditor from "./components/ProfileEditor";
import "./App.css";
import useProfileStore from "./store/profileStore";

// Zmienna do śledzenia pierwszego uruchomienia
let isFirstLoad = true;

function App() {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error'); // 'error' lub 'success'
  
  const profiles = useProfileStore(state => state.profiles);
  const syncError = useProfileStore(state => state.syncError);
  const initializeSync = useProfileStore(state => state.initializeSync);

  // Tylko pierwsze załadowanie
  useEffect(() => {
    if (isFirstLoad) {
      initializeSync();
      isFirstLoad = false;
    }
  }, []);

  // Obsługa powiadomień
  useEffect(() => {
    if (syncError) {
      showNotification(syncError, 'error');
    }
  }, [syncError]);

  const showNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveProfile = async (profileData) => {
    try {
      const store = useProfileStore.getState();
      
      if (profileData.id) {
        await store.updateProfile(profileData.id, profileData);
        showNotification('Profil został zaktualizowany');
      } else {
        await store.addProfile(profileData);
        showNotification('Profil został utworzony');
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error('Błąd zapisywania profilu:', err);
      showNotification(err.message, 'error');
      throw err;
    }
  };

  return (
    <main className="container">
      {showToast && (
        <div className={`toast ${toastType}`}>
          {toastMessage}
        </div>
      )}
      {!isEditing ? (
        <ProfileList 
          onCreateProfile={() => setIsEditing(true)}
          onEditProfile={(profile) => {
            setSelectedProfile(profile);
            setIsEditing(true);
          }}
        />
      ) : (
        <ProfileEditor
          profile={selectedProfile}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </main>
  );
}

export default App;
