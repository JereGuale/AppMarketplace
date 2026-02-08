import React, {useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { register } from '../service/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function RegisterScreen({onNavigateLogin, onRegisterSuccess}){
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [phone,setPhone] = useState('');
  const [city,setCity] = useState('');
  const [password,setPassword] = useState('');
  const [confirmPassword,setConfirmPassword] = useState('');
  const [loading,setLoading] = useState(false);

  const phonePrefix = '+593';

  // Validar que solo contenga letras, espacios y acentos
  const isOnlyLetters = (str) => {
    return /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(str);
  };

  async function handleRegister(){
    if(!name || !email || !phone || !city || !password || !confirmPassword){
      Alert.alert('Error','Por favor completa todos los campos incluyendo la ciudad');
      return;
    }

    // Validar nombre (solo letras y espacios)
    if(!isOnlyLetters(name)){
      Alert.alert('Error','El nombre solo puede contener letras y espacios');
      return;
    }

    // Validar longitud del nombre
    if(name.length < 3){
      Alert.alert('Error','El nombre debe tener al menos 3 caracteres');
      return;
    }

    if(name.length > 80){
      Alert.alert('Error','El nombre no puede exceder 80 caracteres');
      return;
    }

    if(password !== confirmPassword){
      Alert.alert('Error','Las contraseñas no coinciden');
      return;
    }
    if(password.length < 6){
      Alert.alert('Error','La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try{
      const fullPhone = phonePrefix + phone;
      console.log('📨 Registrando usuario...', { name, email, phone: fullPhone, city });
      const res = await register({name,email,phone: fullPhone,password,city});
      console.log('✅ Respuesta registro:', JSON.stringify(res, null, 2));
      console.log('📝 res.user:', JSON.stringify(res?.user));
      console.log('📝 res.user.id:', res?.user?.id, 'tipo:', typeof res?.user?.id);

      // Backend devuelve { user, token } o { message }
      const token = res?.token || res?.access_token || null;
      const userData = res?.user || res;
      
      if(userData && token){
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: userData.id,
          name: userData.name || name,
          email: userData.email || email,
          city: userData.city || city,
          location: userData.location || userData.city || '',
          avatar: userData.avatar || null,
        }));
        await AsyncStorage.removeItem('zm_token');
      }

      if(userData && token){
        Alert.alert('¡Registro exitoso!', 'Tu cuenta ha sido creada.');
        if(typeof onRegisterSuccess === 'function') {
          onRegisterSuccess({
            id: userData.id,
            name: userData.name || name,
            email: userData.email || email,
            city: userData.city || city,
            location: userData.location || userData.city || '',
            avatar: userData.avatar || null,
            token: token
          });
        }
      } else {
        const msg = res?.message || 'No se pudo completar el registro';
        Alert.alert('Error', msg);
      }
    }catch(err){
      Alert.alert('Error','No se pudo conectar al servidor');
    }finally{
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e"]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientBg}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Left Section - Slogan */}
            <View style={styles.leftSection}>
              <Text style={styles.leftTitle}>
                Únete a la{'\n'}
                <Text style={styles.leftBold}>comunidad</Text>
              </Text>
              <Text style={styles.leftSubtitle}>
                Compra y vende productos de segunda mano.{'\n'}
                ¡Regístrate gratis ahora!
              </Text>
            </View>

            {/* Right Section - Register Card */}
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                {/* Icon */}
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>🛍️</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>Crear cuenta</Text>

                {/* Name Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre completo</Text>
                  <TextInput 
                    value={name} 
                    onChangeText={(text) => {
                      // Solo permitir letras, espacios y acentos
                      if(/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]*$/.test(text) && text.length <= 80){
                        setName(text);
                      }
                    }} 
                    style={styles.input} 
                    placeholder="Ej: Juan Pérez" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    maxLength={80}
                  />
                  <Text style={styles.charCounter}>{name.length}/80</Text>
                </View>

                {/* Email Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput 
                    value={email} 
                    onChangeText={setEmail} 
                    style={styles.input} 
                    keyboardType="email-address" 
                    autoCapitalize="none" 
                    placeholder="tu@email.com" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                {/* Phone Field with +593 prefix */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Teléfono</Text>
                  <View style={styles.phoneContainer}>
                    <View style={styles.phonePrefix}>
                      <Text style={styles.phonePrefixText}>{phonePrefix}</Text>
                    </View>
                    <TextInput 
                      value={phone} 
                      onChangeText={setPhone} 
                      style={[styles.input, styles.phoneInput]} 
                      keyboardType="phone-pad" 
                      placeholder="9X XXX XXXX" 
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </View>
                </View>

                {/* City Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ciudad</Text>
                  <TextInput 
                    value={city} 
                    onChangeText={setCity} 
                    style={styles.input} 
                    placeholder="Ej: Madrid, Barcelona, Quito" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                {/* Password Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Contraseña</Text>
                  <TextInput 
                    value={password} 
                    onChangeText={setPassword} 
                    style={styles.input} 
                    secureTextEntry 
                    placeholder="Mínimo 6 caracteres" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                {/* Confirm Password Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirmar contraseña</Text>
                  <TextInput 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                    style={styles.input} 
                    secureTextEntry 
                    placeholder="Repite tu contraseña" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                {/* Register Button */}
                <TouchableOpacity 
                  style={styles.registerButton} 
                  onPress={handleRegister}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <LinearGradient 
                    colors={["#FF6B9D", "#E94560"]} 
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Crear cuenta</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                  <TouchableOpacity onPress={onNavigateLogin}>
                    <Text style={styles.loginLink}>Inicia sesión</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  gradientBg: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: isMobile ? 40 : 60,
  },
  container: {
    flex: 1,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: isMobile ? 'center' : 'space-evenly',
    paddingHorizontal: isMobile ? 24 : 80,
    gap: isMobile ? 40 : 60,
  },

  // Left Section
  leftSection: {
    flex: isMobile ? 0 : 1,
    maxWidth: isMobile ? '100%' : 500,
    alignItems: isMobile ? 'center' : 'flex-start',
  },
  leftTitle: {
    fontSize: isMobile ? 40 : 58,
    fontWeight: '300',
    color: '#fff',
    lineHeight: isMobile ? 48 : 68,
    marginBottom: 24,
    letterSpacing: -1,
    textAlign: isMobile ? 'center' : 'left',
  },
  leftBold: {
    fontWeight: '900',
    color: '#fff',
  },
  leftSubtitle: {
    fontSize: isMobile ? 16 : 19,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '400',
    lineHeight: 28,
    letterSpacing: 0.3,
    textAlign: isMobile ? 'center' : 'left',
  },

  // Card Container
  cardContainer: {
    width: isMobile ? '100%' : 420,
    maxWidth: 420,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 15,
      },
    }),
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: 'rgba(19, 193, 172, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(19, 193, 172, 0.3)',
  },
  logoIcon: {
    fontSize: 40,
  },

  // Title
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.3,
  },

  // Form
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    fontWeight: '500',
  },
  charCounter: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    textAlign: 'right',
    fontWeight: '500',
  },

  // Phone input
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  phonePrefix: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  phonePrefixText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
  },

  // Register Button
  registerButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(233,69,96,0.5)',
      },
      default: {
        shadowColor: '#E94560',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Login
  loginContainer: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 14,
    color: '#13c1ac',
    fontWeight: '700',
  },
});
