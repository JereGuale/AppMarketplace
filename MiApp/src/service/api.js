import { Platform } from 'react-native';
import Constants from 'expo-constants';

let API_BASE = null;

export function resolveApiBase(){
  if (API_BASE) return API_BASE;
  
  // Prioridad 1: Variable de entorno (mejor para producción)
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (fromEnv) {
    API_BASE = fromEnv.replace(/\/$/, '');
    console.log('✅ API Base from ENV:', API_BASE);
    return API_BASE;
  }

  // Prioridad 2: Detectar automáticamente del hostUri de Expo
  const hostUri = Constants.expoConfig?.hostUri || '';
  if (hostUri) {
    const host = hostUri.split(':')[0];
    API_BASE = `http://${host}:8000`;
    console.log('✅ API Base from Expo hostUri:', API_BASE);
    return API_BASE;
  }

  // Prioridad 3: Valores por defecto seguros
  if (Platform.OS === 'android') {
    API_BASE = 'http://10.0.2.2:8000'; // Emulador Android
    console.log('✅ API Base for Android emulator:', API_BASE);
  } else {
    API_BASE = 'http://localhost:8000'; // Web/iOS
    console.log('✅ API Base default (localhost):', API_BASE);
  }
  return API_BASE;
}

async function postJson(path, body, token = null){
  try{
    const url = resolveApiBase() + path;
    console.log('📡 POST to:', url);
    
    const headers = {'Content-Type':'application/json','Accept':'application/json'};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const r = await fetch(url, {
      method:'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const text = await r.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      console.warn('⚠️ No JSON response:', parseErr.message);
    }

    if(r.ok) {
      console.log('✅ POST Success, status:', r.status, 'has data:', !!json);
      return json;
    }
    
    console.log('❌ POST Server error, status:', r.status, 'message:', json?.message || 'Unknown');
    return json || { message: 'Error desconocido' };
  }catch(err){
    console.error('🔴 Network error:', err.message);
    return null;
  }
}

async function getJson(path, token = null){
  try{
    const url = resolveApiBase() + path;
    console.log('📡 GET from:', url);
    
    const headers = {'Accept':'application/json'};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const r = await fetch(url, {
      method: 'GET',
      headers
    });
    
    const text = await r.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      console.warn('⚠️ No JSON response:', parseErr.message);
    }
    if(r.ok) {
      console.log('✅ GET Success, status:', r.status, 'data length:', Array.isArray(json) ? json.length : typeof json);
      return json;
    }
    
    console.log('❌ Server error:', r.status, json);
    return json || { message: 'Error desconocido' };
  }catch(err){
    console.error('🔴 Network error:', err.message);
    return null;
  }
}

export { postJson, getJson };

export async function signIn(payload){
  return await postJson('/api/login', payload);
}

export async function register(payload){
  return await postJson('/api/register', payload);
}

export async function createProduct(payload, token){
  return await postJson('/api/products', payload, token);
}

export async function getProducts(){
  return await getJson('/api/products');
}

export async function getMyProducts(token){
  return await getJson('/api/my-products', token);
}

async function putJson(path, body, token = null){
  try{
    const url = resolveApiBase() + path;
    console.log('📡 PUT to:', url);
    
    const headers = {'Content-Type':'application/json','Accept':'application/json'};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const r = await fetch(url, {
      method:'PUT',
      headers,
      body: JSON.stringify(body)
    });
    
    const text = await r.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      console.warn('⚠️ No JSON response:', parseErr.message);
    }

    if(r.ok) {
      console.log('✅ Success:', json);
      return json;
    }
    
    console.log('❌ Server error:', json);
    return json || { message: 'Error desconocido' };
  }catch(err){
    console.error('🔴 Network error:', err.message);
    return null;
  }
}

export async function updateUserProfile(payload, token){
  return await putJson('/api/user/profile', payload, token);
}

export async function uploadAvatar(file, token) {
  try {
    const url = resolveApiBase() + '/api/user/avatar';
    console.log('📡 POST avatar to:', url);
    console.log('📎 File URI:', file);
    
    const formData = new FormData();
    
    // Para web: convertir blob/data URI a File
    if (typeof file === 'string' && (file.startsWith('blob:') || file.startsWith('data:') || file.startsWith('http://localhost'))) {
      try {
        const resp = await fetch(file);
        const blob = await resp.blob();
        
        // Determinar extensión y tipo MIME desde el blob
        let extension = 'jpg';
        let mimeType = blob.type || 'image/jpeg';
        
        if (mimeType.includes('png')) {
          extension = 'png';
        } else if (mimeType.includes('webp')) {
          extension = 'webp';
        }
        
        const filename = `avatar_${Date.now()}.${extension}`;
        
        // Crear un objeto File real en lugar de solo Blob
        const avatarFile = new File([blob], filename, { type: mimeType });
        formData.append('avatar', avatarFile);
        
        console.log('✅ Archivo preparado:', filename, mimeType);
      } catch (blobErr) {
        console.error('❌ Error convirtiendo blob:', blobErr.message);
        return { message: 'Error procesando la imagen' };
      }
    } else {
      // Para React Native móvil
      formData.append('avatar', {
        uri: file,
        type: 'image/jpeg',
        name: `avatar_${Date.now()}.jpg`,
      });
    }
    
    const headers = { 'Accept': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const json = await r.json();
    
    if (r.ok) {
      console.log('✅ Avatar uploaded:', json);
      return json;
    }
    
    console.log('❌ Upload error:', json);
    return json;
  } catch (err) {
    console.error('🔴 Upload error:', err.message);
    return null;
  }
}

export async function getConversations(token) {
  return await getJson('/api/conversations', token);
}

export async function getConversation(id, token) {
  return await getJson(`/api/conversations/${id}`, token);
}

export async function sendMessage(payload, token) {
  return await postJson('/api/messages', payload, token);
}

export async function deleteConversation(id, token) {
  try {
    const url = resolveApiBase() + `/api/conversations/${id}`;
    const headers = { 'Accept': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const r = await fetch(url, { method: 'DELETE', headers });
    return await r.json();
  } catch (err) {
    console.error('🔴 Delete error:', err);
    return null;
  }
}

export async function getNotifications(token) {
  return await getJson('/api/notifications', token);
}

export async function markNotificationAsRead(id, token) {
  return await putJson(`/api/notifications/${id}/read`, {}, token);
}

export async function markAllNotificationsAsRead(token) {
  return await putJson('/api/notifications/read-all', {}, token);
}

export async function markProductSold(id, token) {
  return await putJson(`/api/products/${id}/sold`, {}, token);
}

export default {
  signIn, 
  register, 
  createProduct, 
  getProducts, 
  getMyProducts, 
  updateUserProfile, 
  uploadAvatar,
  getConversations,
  getConversation,
  sendMessage,
  deleteConversation,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markProductSold,
  postJson, 
  getJson, 
  putJson
};
