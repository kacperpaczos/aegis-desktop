import { API_URL } from '../config/constants';

const defaultOptions = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin'
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Błąd połączenia z serwerem');
  }
  return response.json();
};

const logRequest = (method, url, data = null) => {
  console.group(`🌐 API Request [${new Date().toLocaleTimeString()}]`);
  console.log(`📤 ${method} ${url}`);
  if (data) {
    console.log('Request Payload:', JSON.stringify(data, null, 2));
  }
  console.groupEnd();
};

const logResponse = (method, url, status, data) => {
  console.group(`📥 API Response [${new Date().toLocaleTimeString()}]`);
  console.log(`${method} ${url}`);
  console.log('Status:', status);
  console.log('Response Data:', JSON.stringify(data, null, 2));
  console.groupEnd();
};

export const profileApi = {
  async loadAllProfiles() {
    const url = '/api/v1/profile/get-all';
    logRequest('GET', url);
    
    const response = await fetch(url, {
      ...defaultOptions,
      method: 'GET'
    });
    
    const data = await handleResponse(response);
    logResponse('GET', url, response.status, data);
    return data;
  },

  async syncProfiles(profiles) {
    const url = '/api/v1/profile/sync';
    const payload = { profiles };
    
    console.log('🔄 Rozpoczynam synchronizację profili:', {
      liczbaProfilów: profiles.length,
      profile: profiles.map(p => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt
      }))
    });
    
    logRequest('POST', url, payload);
    
    try {
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await handleResponse(response);
      
      if (data.status === 'error' && data.message.includes('Invalid access')) {
        throw new Error('Brak uprawnień dostępu do serwera. Sprawdź swoje uprawnienia.');
      }
      
      console.log('✅ Synchronizacja zakończona:', {
        status: response.status,
        odpowiedźSerwera: data
      });
      
      logResponse('POST', url, response.status, data);
      return data;
    } catch (error) {
      console.error('❌ Błąd synchronizacji:', error);
      throw error;
    }
  },

  async trainFaceModel(profileId) {
    const url = '/api/v1/face/train';
    const randomId = Math.random().toString(36).substring(7);
    const payload = { 
      profile_id: profileId,
      video_path: `~/.facenet/videos/nagranie_${randomId}.mp4`
    };
    
    logRequest('POST', url, payload);
    
    try {
      const response = await fetch(url, {
        ...defaultOptions,
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await handleResponse(response);
      logResponse('POST', url, response.status, data);
      return data;
    } catch (err) {
      console.error('Błąd podczas trenowania modelu:', err);
      throw new Error('Nie udało się przetrenować modelu rozpoznawania twarzy. ' + 
        (err.message || 'Sprawdź połączenie z serwerem.'));
    }
  }
}; 