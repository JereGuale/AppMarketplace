import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';

export default function EditProfileModal({
  styles,
  visible,
  saving,
  newCity,
  setNewCity,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  onSave,
  onClose,
  onChangeAvatar,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Editar perfil</Text>

          <TouchableOpacity
            style={styles.modalAvatarBtn}
            onPress={onChangeAvatar}
            disabled={saving}
          >
            <Text style={styles.modalAvatarText}>Actualizar foto</Text>
          </TouchableOpacity>

          <Text style={styles.modalLabel}>Ciudad</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Ej: Manta"
            placeholderTextColor="#94a3b8"
            value={newCity}
            onChangeText={setNewCity}
            editable={!saving}
          />

          <Text style={styles.modalLabel}>Nueva contraseña (opcional)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!saving}
          />

          <Text style={styles.modalLabel}>Confirmar contraseña</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!saving}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={!saving ? onClose : undefined}
              disabled={saving}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalSave, saving && styles.modalSaveDisabled]}
              onPress={onSave}
              disabled={saving}
            >
              <Text style={styles.modalSaveText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
