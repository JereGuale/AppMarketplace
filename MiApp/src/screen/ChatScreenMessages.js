import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, Keyboard, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { getConversation, sendMessage as sendMessageAPI, resolveApiBase } from '../service/api';

const IS_WEB = Platform.OS === 'web';

const toFullUrl = (uri) => {
  if (!uri) return null;
  if (typeof uri !== 'string') return uri;
  // Ignorar blobs/archivos locales en web para evitar errores
  if (IS_WEB && (uri.startsWith('file:') || uri.startsWith('blob:'))) return null;

  const normalized = uri.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const clean = normalized.replace(/^\//, '');
  if (clean.startsWith('storage/')) return `${resolveApiBase()}/${clean}`;
  if (clean.startsWith('public/')) return `${resolveApiBase()}/${clean}`;
  return `${resolveApiBase()}/${clean}`;
};

const normalizeList = (list) => (Array.isArray(list) ? list : []);

const mergeMessages = (serverList, localList) => {
  const byKey = new Map();

  const add = (msg) => {
    if (!msg) return;
    const created = msg.created_at || msg.createdAt || null;
    const key = msg.id
      ? `id-${msg.id}`
      : msg.tempId
        ? `temp-${msg.tempId}`
        : `time-${created || msg.text || Math.random()}`;

    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, msg);
      return;
    }

    const prevDate = new Date(prev.created_at || prev.createdAt || 0).getTime();
    const nextDate = new Date(created || 0).getTime();
    if (nextDate >= prevDate) {
      byKey.set(key, msg);
    }
  };

  normalizeList(serverList).forEach(add);
  normalizeList(localList).forEach(add);
  return Array.from(byKey.values()).sort((a, b) => {
    const aDate = new Date(a.created_at || a.createdAt || 0).getTime();
    const bDate = new Date(b.created_at || b.createdAt || 0).getTime();
    return aDate - bDate;
  });
};

export default function ChatScreenMessages({ conversation, product, onBack = () => {}, userData = {}, onMessageSent }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef(null);
  const [conversationId, setConversationId] = useState(conversation?.id || null);
  const latestMessagesRef = useRef([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBack = () => {
    setMenuOpen(false);
    if (typeof onBack === 'function') onBack();
  };

  const commitMessages = (updater) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestMessagesRef.current = next;
      return next;
    });
  };

  const getSafeAvatar = (uri) => {
    if (!uri) return null;
    if (IS_WEB && (uri.startsWith('file:') || uri.startsWith('blob:'))) {
      return null;
    }
    return uri;
  };

  // Obtener avatar del otro usuario en la conversación
  const getOtherUserAvatar = () => {
    if (conversation?.user_id === userData.id) {
      return getSafeAvatar(conversation?.seller?.avatar);
    } else {
      return getSafeAvatar(conversation?.user?.avatar);
    }
  };

  const otherUserAvatar = getOtherUserAvatar();
  
  // Obtener nombre del otro usuario
  const getOtherUserName = () => {
    if (!conversation) return '?';
    if (conversation.user_id === userData.id) {
      return conversation.seller?.name || conversation.sellerName || '?';
    } else {
      return conversation.user?.name || conversation.userName || '?';
    }
  };
  
  const otherUserName = getOtherUserName();
  const otherUserInitial = otherUserName?.charAt(0)?.toUpperCase() || '?';

  useEffect(() => {
    loadMessages();
  }, [conversation?.id]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const loadMessages = async () => {
    try {
      if (!conversation) {
        console.log('⚠️ Sin conversación');
        commitMessages([]);
        return;
      }

      console.log('📂 Cargando mensajes de conversación:', conversation.id);
      setConversationId(conversation.id || null);
      
      // Mostrar los mensajes del prop inmediatamente si existen
      if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
        commitMessages(conversation.messages);
        console.log('✅ Mensajes iniciales cargados:', conversation.messages.length);
      } else {
        console.log('⚠️ Sin mensajes en prop conversación');
        commitMessages([]);
      }

      // Luego cargar desde servidor para actualizaciones
      if (conversation.id) {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          try {
            const data = await getConversation(conversation.id, userToken);
            if (data) {
              console.log('📥 Datos del servidor:', { id: data.id, messagesCount: data.messages?.length });
              if (data.messages && Array.isArray(data.messages)) {
                commitMessages(data.messages);
                console.log('✅ Mensajes del servidor actualizados:', data.messages.length);
              }
            }
          } catch (fetchErr) {
            console.log('⚠️ Error fetching servidor (continuamos con caché):', fetchErr.message);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error en loadMessages:', error);
      commitMessages([]);
    }
  };

  const deleteChat = async () => {
    try {
      if (!conversationId) {
        onBack();
        return;
      }
      const hiddenRaw = await AsyncStorage.getItem('hidden_conversations');
      const hiddenIds = hiddenRaw ? JSON.parse(hiddenRaw) : [];
      const updatedHidden = Array.from(new Set([...hiddenIds, conversationId]));
      await AsyncStorage.setItem('hidden_conversations', JSON.stringify(updatedHidden));

      // Limpia caché local de conversaciones para que desaparezca en la lista
      const cached = await AsyncStorage.getItem('cached_conversations');
      if (cached) {
        const parsed = JSON.parse(cached) || [];
        const filtered = parsed.filter(c => c.id !== conversationId);
        await AsyncStorage.setItem('cached_conversations', JSON.stringify(filtered));
      }

      onBack();
    } catch (error) {
      console.log('Error ocultando chat:', error);
      onBack();
    }
  };

  const reportVendor = () => {
    setMenuOpen(false);
    alert('Reporte enviado al equipo.');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await sendMessage(result.assets[0].uri);
    }
  };

  const sendMessage = async (imageUri = null) => {
    if (!messageText.trim() && !imageUri) return;

    // Deshabilita envío si no tenemos target claro
    if (!conversationId && !product) {
      console.log('⚠️ No hay conversación ni producto asociado para iniciar chat');
      return;
    }

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        console.log('⚠️ No hay token de usuario');
        return;
      }

      const payload = {
        text: messageText.trim(),
        conversation_id: conversationId,
      };

      if (!conversationId && product) {
        payload.seller_id = product.user_id || product.user?.id;
        payload.product_id = product.id;
      }

      // TODO: Implementar subida de imágenes al backend
      // if (imageUri) {
      //   payload.image = imageUri;
      // }

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: null,
        tempId,
        text: payload.text,
        sender_id: userData.id,
        sender: { id: userData.id, name: userData.name, avatar: userData.avatar },
        created_at: new Date().toISOString(),
      };

      commitMessages((prev) => [...prev, optimisticMsg]);
      setMessageText('');
      Keyboard.dismiss();

      const response = await sendMessageAPI(payload, userToken);

      // Validar que la respuesta sea exitosa
      if (!response) {
        console.log('❌ Error: No hay respuesta del servidor');
        // Remover mensaje temporal si falla
        commitMessages((prev) => prev.filter(
          (m) => m.tempId !== tempId
        ));
        alert('Error al enviar el mensaje. Verifica tu conexión e intenta de nuevo.');
        return;
      }

      const resolvedConversationId = response?.conversation_id || response?.conversation?.id || conversationId;
      if (!conversationId && resolvedConversationId) {
        setConversationId(resolvedConversationId);
        console.log('✅ Nueva conversación creada con ID:', resolvedConversationId);
      }

      const returnedMsg = response?.message;
      if (returnedMsg && returnedMsg.id) {
        const normalized = {
          ...returnedMsg,
          created_at: returnedMsg.created_at || new Date().toISOString(),
          sender: returnedMsg.sender || { id: userData.id, name: userData.name, avatar: userData.avatar },
        };

        commitMessages((prev) => {
          // Reemplazar el mensaje temporal con el del servidor
          return prev.map((m) => 
            m.tempId === tempId ? normalized : m
          );
        });
        console.log('✅ Mensaje enviado y actualizado en la lista:', normalized.id);
      } else {
        console.log('⚠️ Respuesta inesperada al enviar mensaje:', response);
        // Mantener el mensaje temporal si no hay confirmación del servidor
      }

      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.log('❌ Error enviando mensaje:', error);
      // Remover mensaje temporal en caso de excepción
      commitMessages((prev) => prev.filter(
        (m) => m.tempId !== tempId
      ));
      alert('Error de conexión. Intenta de nuevo.');
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === userData.id;
    const showAvatar = !isMyMessage;
    
    // Obtener avatar del remitente - si no está en item.sender, usar el avatar de la conversación
    let senderAvatar = null;
    if (item.sender?.avatar) {
      senderAvatar = getSafeAvatar(item.sender.avatar);
    } else if (!isMyMessage) {
      senderAvatar = otherUserAvatar;
    }
    
    // Obtener nombre del remitente
    let senderName = item.sender?.name || (isMyMessage ? userData.name : otherUserName) || '?';

    return (
      <View style={[styles.messageRow, isMyMessage && styles.messageRowRight]}>
        {showAvatar && (
          <View style={styles.messageAvatar}>
            {senderAvatar ? (
              <Image source={{ uri: senderAvatar }} style={styles.messageAvatarImage} />
            ) : (
              <Text style={styles.messageAvatarText}>
                {senderName?.charAt(0) || '?'}
              </Text>
            )}
          </View>
        )}
        <View style={[styles.messageBubble, isMyMessage && styles.messageBubbleRight]}>
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.messageImage} />
          )}
          {item.text ? (
            <Text style={[styles.messageText, isMyMessage && styles.messageTextRight]}>
              {item.text}
            </Text>
          ) : null}
          <Text style={[styles.messageTime, isMyMessage && styles.messageTimeRight]}>
            {new Date(item.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const resolveImage = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img;
    if (img.url) return resolveImage(img.url);
    if (img.uri) return resolveImage(img.uri);
    if (img.path) return resolveImage(img.path);
    if (img.image) return resolveImage(img.image);
    if (img.main_image) return resolveImage(img.main_image);
    if (img.photo) return resolveImage(img.photo);
    if (img.thumbnail) return resolveImage(img.thumbnail);
    return null;
  };

  const productData = product || conversation?.product || {};
  
  // Procesar images - puede ser array o JSON string
  let imagesArray = [];
  if (productData.images) {
    if (typeof productData.images === 'string') {
      try {
        imagesArray = JSON.parse(productData.images);
      } catch (e) {
        imagesArray = [productData.images];
      }
    } else if (Array.isArray(productData.images)) {
      imagesArray = productData.images;
    }
  }
  
  const productImageRaw =
    resolveImage(imagesArray[0]) ||
    resolveImage(productData.image) ||
    resolveImage(productData.main_image) ||
    resolveImage(productData.photo) ||
    resolveImage(productData.thumbnail);
  const productImage = toFullUrl(productImageRaw);
  console.log('🖼️ Product Image Debug:', { productImageRaw, productImage, imagesArray });
  const productName =
    productData.name ||
    productData.title ||
    conversation?.product?.name ||
    conversation?.product?.title ||
    conversation?.product_name ||
    conversation?.productTitle ||
    conversation?.product?.product_name ||
    '';

  useEffect(() => {
    // Cerrar menú si se navega atrás/refresh estado de conversación
    setMenuOpen(false);
  }, [conversationId]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {otherUserAvatar ? (
            <Image source={{ uri: otherUserAvatar }} style={styles.headerUserAvatarSmall} />
          ) : (
            <View style={[styles.headerUserAvatarSmall, styles.headerUserAvatarPlaceholder]}>
              <Text style={styles.headerUserAvatarTextSmall}>{otherUserInitial}</Text>
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={2}>
            {productName || 'Producto'}
          </Text>
        </View>

        <View style={styles.menuWrapper}>
          <TouchableOpacity onPress={() => setMenuOpen((v) => !v)} style={styles.menuBtn}>
            <Text style={styles.menuBtnIcon}>⋮</Text>
          </TouchableOpacity>
          {menuOpen && (
            <View style={styles.menuDropdown}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); deleteChat(); }}>
                <Text style={styles.menuItemText}>Eliminar chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={reportVendor}>
                <Text style={styles.menuItemText}>Reportar vendedor</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id?.toString() || item.tempId || `${item.created_at}-${item.text}`}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            <Text style={styles.imageBtnIcon}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#64748b"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0d1117' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 32, color: '#cbd5e1', fontWeight: '300' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#f1f5f9', textAlign: 'left' },
  headerUserAvatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', overflow: 'hidden' },
  headerUserAvatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  headerUserAvatarTextSmall: { fontSize: 12, color: '#cbd5e1', fontWeight: '600' },
  container: { flex: 1 },
  messagesList: { padding: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  messageRowRight: { flexDirection: 'row-reverse' },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  messageAvatarText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  messageAvatarImage: { width: 32, height: 32, borderRadius: 16 },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    backgroundColor: '#0084ff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageText: { fontSize: 15, color: '#e2e8f0', marginBottom: 4 },
  messageTextRight: { color: '#ffffff' },
  messageTime: { fontSize: 11, color: '#64748b', alignSelf: 'flex-end' },
  messageTimeRight: { color: '#bfdbfe' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  imageBtnIcon: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#f1f5f9',
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0084ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnText: { fontSize: 20, color: '#ffffff' },
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnIcon: { fontSize: 20 },
  menuWrapper: {
    position: 'relative',
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnIcon: { fontSize: 18, color: '#cbd5e1' },
  menuDropdown: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingVertical: 4,
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
});
