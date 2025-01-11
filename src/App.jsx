import { useState, useEffect } from "react";
import ProfileList from "./components/ProfileList";
import ProfileEditor from "./components/ProfileEditor";
import "./App.css";
import useProfileStore from "./store/profileStore";

function App() {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const profiles = useProfileStore(state => state.profiles);
  const syncError = useProfileStore(state => state.syncError);

  useEffect(() => {
    if (syncError) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncError]);

  const handleCreateProfile = () => {
    setSelectedProfile(null);
    setIsEditing(true);
  };

  const handleEditProfile = (profile) => {
    setSelectedProfile(profile);
    setIsEditing(true);
  };

  const handleSaveProfile = async (profileData) => {
    try {
      const store = useProfileStore.getState();
      
      if (profileData.id) {
        await store.updateProfile(profileData.id, profileData);
      } else {
        await store.addProfile(profileData);
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error('Błąd zapisywania profilu:', err);
      throw err;
    }
  };

  return (
    <main className="container">
      {syncError && showToast && (
        <div className="sync-error-toast">
          {syncError}
        </div>
      )}
      {!isEditing ? (
        <ProfileList 
          onCreateProfile={handleCreateProfile}
          onEditProfile={handleEditProfile}
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
