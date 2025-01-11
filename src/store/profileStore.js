import { create } from 'zustand';
import { profileApi } from '../api/profileApi';

const useProfileStore = create((set, get) => ({
  profiles: [],
  syncError: null,
  loadingStates: {
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    isInitializing: false
  },
  
  initializeSync: async () => {
    console.log('🔄 Inicjalizacja synchronizacji z serwerem...');
    set(state => ({
      loadingStates: { ...state.loadingStates, isInitializing: true }
    }));
    try {
      const data = await profileApi.loadAllProfiles();
      set({ 
        profiles: data.profiles,
        syncError: null,
        loadingStates: { ...get().loadingStates, isInitializing: false }
      });
      console.log('✅ Synchronizacja zakończona sukcesem');
    } catch (error) {
      console.error('❌ Błąd synchronizacji:', error);
      set({ 
        syncError: 'Nie udało się pobrać profili z serwera',
        loadingStates: { ...get().loadingStates, isInitializing: false }
      });
      setTimeout(() => get().initializeSync(), 5000);
    }
  },

  addProfile: async (profile) => {
    set(state => ({
      loadingStates: { ...state.loadingStates, isSaving: true }
    }));
    try {
      const newProfile = {
        ...profile,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        profiles: [...state.profiles, newProfile],
        loadingStates: { ...state.loadingStates, isSaving: false }
      }));

      await profileApi.syncProfiles(get().profiles);
      set({ syncError: null });
      return newProfile;
    } catch (error) {
      set(state => ({ 
        syncError: 'Nie udało się zapisać profilu',
        loadingStates: { ...state.loadingStates, isSaving: false }
      }));
      throw new Error('Nie udało się zapisać profilu');
    }
  },

  updateProfile: async (id, updatedData) => {
    console.log('📝 Rozpoczynam aktualizację profilu:', {
      id,
      aktualizowaneDane: updatedData
    });
    
    set(state => ({
      loadingStates: { ...state.loadingStates, isSaving: true }
    }));
    
    try {
      const updatedProfile = {
        ...updatedData,
        id,
        updatedAt: new Date().toISOString()
      };
      
      console.log('🔄 Rozpoczynam synchronizację z serwerem');
      await profileApi.syncProfiles([
        ...get().profiles.filter(p => p.id !== id),
        updatedProfile
      ]);
      console.log('✅ Synchronizacja zakończona pomyślnie');
      
      set(state => ({
        profiles: state.profiles.map(p => p.id === id ? updatedProfile : p),
        loadingStates: { ...state.loadingStates, isSaving: false },
        syncError: null
      }));
      
      return updatedProfile;
    } catch (error) {
      console.error('❌ Błąd podczas aktualizacji profilu:', error);
      set(state => ({ 
        syncError: error.message || 'Nie udało się zaktualizować profilu',
        loadingStates: { ...state.loadingStates, isSaving: false }
      }));
      throw error;
    }
  },

  deleteProfile: async (id) => {
    set(state => ({
      loadingStates: { ...state.loadingStates, isDeleting: true }
    }));
    try {
      set(state => ({
        profiles: state.profiles.filter(p => p.id !== id),
        loadingStates: { ...state.loadingStates, isDeleting: false }
      }));

      await profileApi.syncProfiles(get().profiles);
      set({ syncError: null });
    } catch (error) {
      set(state => ({ 
        syncError: 'Nie udało się usunąć profilu',
        loadingStates: { ...state.loadingStates, isDeleting: false }
      }));
      throw new Error('Nie udało się usunąć profilu');
    }
  },

  clearError: () => {
    set({ syncError: null });
  }
}));

export default useProfileStore; 