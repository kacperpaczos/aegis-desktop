import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';

const API_URL = 'http://localhost:8080';

const fetchWithCORS = async (url, options = {}) => {
  const defaultOptions = {
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'http://localhost:1420',
    },
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'http://localhost:1420',
    },
  };

  return fetch(url, defaultOptions);
};

const fetchWithTimeout = async (url, options = {}) => {
  const timeout = 5000; // 5 sekund
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetchWithCORS(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Przekroczono limit czasu połączenia');
    }
    throw error;
  }
};

const useProfileStore = create(
  persist(
    (set, get) => ({
      profiles: [],
      syncError: null,
      syncRetryTimeout: null,
      
      initializeSync: async () => {
        try {
          const response = await fetchWithTimeout(`${API_URL}/profiles/load`, {
            method: 'POST',
            body: JSON.stringify({})
          });
          
          if (!response.ok) {
            throw new Error('Nie można połączyć się z serwerem');
          }
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Błąd podczas wczytywania profili');
          }
          
          const serverData = result.data;
          if (!serverData || !serverData.profiles) {
            set({ profiles: [] });
          } else {
            set({ profiles: serverData.profiles });
          }
          
          get().clearSyncError();
        } catch (err) {
          console.error('Błąd inicjalizacji synchronizacji:', err);
          set({ syncError: err.message || 'Błąd synchronizacji z serwerem' });
          
          const timeout = setTimeout(() => {
            set({ syncError: null });
            get().initializeSync();
          }, 7000);
          
          set({ syncRetryTimeout: timeout });
        }
      },

      saveToServer: async (profiles) => {
        try {
          const response = await fetchWithTimeout(`${API_URL}/profiles/save`, {
            method: 'POST',
            body: JSON.stringify({
              profiles: profiles.map(profile => ({
                id: profile.id,
                name: profile.name,
                pin: profile.pin,
                avatar: profile.avatar,
                background: profile.background,
                photos: profile.photos || [],
                videos: profile.videos || [],
                created_at: profile.createdAt,
                updated_at: profile.updatedAt
              }))
            })
          });

          if (!response.ok) {
            throw new Error('Błąd zapisu na serwerze');
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || 'Błąd podczas zapisywania profili');
          }
          
          get().clearSyncError();
        } catch (err) {
          console.error('Błąd synchronizacji z serwerem:', err);
          set({ syncError: err.message || 'Błąd synchronizacji z serwerem' });
          
          if (get().syncRetryTimeout) {
            clearTimeout(get().syncRetryTimeout);
          }
          
          const timeout = setTimeout(() => {
            set({ syncError: null });
            get().saveToServer(profiles);
          }, 7000);
          
          set({ syncRetryTimeout: timeout });
        }
      },

      clearSyncError: () => {
        set({ syncError: null });
        if (get().syncRetryTimeout) {
          clearTimeout(get().syncRetryTimeout);
          set({ syncRetryTimeout: null });
        }
      },
      
      addProfile: async (profile) => {
        const newProfile = {
          id: Date.now().toString(),
          name: profile.name,
          pin: profile.pin || null,
          avatar: profile.avatar || 'FaUser',
          videos: profile.videos || [],
          photos: profile.photos || [],
          createdAt: new Date().toISOString()
        };
        
        set(state => ({
          profiles: [...state.profiles, newProfile]
        }));

        // Asynchroniczna synchronizacja bez blokowania
        const updatedProfiles = [...get().profiles, newProfile];
        get().saveToServer(updatedProfiles);
      },

      updateProfile: async (id, updatedData) => {
        set(state => ({
          profiles: state.profiles.map(profile => 
            profile.id === id 
              ? { ...profile, ...updatedData, updatedAt: new Date().toISOString() }
              : profile
          )
        }));

        // Asynchroniczna synchronizacja bez blokowania
        get().saveToServer(get().profiles);
      },

      deleteProfile: async (id) => {
        set(state => ({
          profiles: state.profiles.filter(profile => profile.id !== id)
        }));

        // Asynchroniczna synchronizacja bez blokowania
        get().saveToServer(get().profiles);
      },

      getProfile: (id) => {
        return get().profiles.find(profile => profile.id === id);
      },

      addMediaToProfile: (profileId, mediaType, path) => {
        set(state => ({
          profiles: state.profiles.map(profile => {
            if (profile.id !== profileId) return profile;
            const mediaArray = mediaType === 'photo' ? 'photos' : 'videos';
            return {
              ...profile,
              [mediaArray]: [...profile[mediaArray], path]
            };
          })
        }));
      }
    }),
    {
      name: 'profiles-storage',
      getStorage: () => localStorage,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeSync();
        }
      }
    }
  )
);

export default useProfileStore; 