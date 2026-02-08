import React, {useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, Dimensions, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postJson } from '../service/api';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

export default function LoginScreen({onNavigateRegister, onLoginSuccess}){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('user'); // 'user' o 'admin'

  async function handleSignIn(){
    if(!email || !password){
      Alert.alert('Error', 'Por favor completa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      // Intentar login con backend
      const response = await postJson('/api/login', { 
        email, 
        password,
        login_type: loginMode
      });
      console.log('🔐 Response del servidor:', JSON.stringify(response, null, 2));
      console.log('🔐 response.user:', JSON.stringify(response?.user));
      console.log('🔐 response.user.id:', response?.user?.id, 'tipo:', typeof response?.user?.id);
      
      if (response && response.token) {
        // Guardar token en AsyncStorage
        await AsyncStorage.setItem('userToken', response.token);

        // Preservar avatar previo si existe
        let existing = {};
        try {
          const prev = await AsyncStorage.getItem('userData');
          existing = prev ? JSON.parse(prev) : {};
        } catch (e) {
          existing = {};
        }

        // El backend puede devolver response.user o el user puede estar directamente en response
        const userData = response.user || response;
        
        const userPayload = {
          id: userData.id,
          email: userData.email || email,
          name: userData.name || 'Usuario',
          city: userData.city || '',
          location: userData.location || userData.city || '',
          avatar: existing.avatar || userData.avatar,
          role: userData.role || 'client',
          isAdmin: userData.role === 'admin',
        };
        console.log('👤 userData del servidor:', JSON.stringify(userData));
        console.log('👤 userPayload final:', JSON.stringify(userPayload));

        await AsyncStorage.setItem('userData', JSON.stringify(userPayload));
        
        console.log('✅ Login exitoso, token guardado');
        if(typeof onLoginSuccess === 'function') {
          onLoginSuccess({ 
            ...userPayload,
            token: response.token 
          });
        }
      } else {
        const message = response?.message || 'Credenciales inválidas';
        Alert.alert('Error', message);
      }
    } catch (err) {
      console.error('Error de login:', err);
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
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
                Compra y vende{'\n'}
                <Text style={styles.leftBold}>lo que quieras</Text>
              </Text>
              <Text style={styles.leftSubtitle}>
                Miles de productos cerca de ti.{'\n'}
                De segunda mano y nuevos. ¡Únete ahora!
              </Text>
            </View>

            {/* Right Section - Login Card */}
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                {/* Icon/Logo */}
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>{loginMode === 'admin' ? '🔐' : '🛍️'}</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>
                  {loginMode === 'admin' ? 'Panel de Administrador' : 'Iniciar Sesión'}
                </Text>

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

                {/* Password Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Contraseña</Text>
                  <TextInput 
                    value={password} 
                    onChangeText={setPassword} 
                    style={styles.input} 
                    secureTextEntry 
                    placeholder="••••••••" 
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity 
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
                  onPress={handleSignIn}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <LinearGradient 
                    colors={loginMode === 'admin' ? ["#5A67D8", "#4C51BF"] : ["#FF6B9D", "#E94560"]} 
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.buttonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>
                        {loginMode === 'admin' ? 'Acceder como Admin' : 'Entrar'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>O</Text>
                  <View style={styles.divider} />
                </View>

                {/* Toggle Admin Mode */}
                {loginMode === 'user' ? (
                  <TouchableOpacity 
                    style={styles.adminModeButton}
                    onPress={() => {
                      setLoginMode('admin');
                      setEmail('');
                      setPassword('');
                    }}
                  >
                    <Text style={styles.adminModeButtonText}>🔐 Iniciar como Administrador</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.userModeButton}
                    onPress={() => {
                      setLoginMode('user');
                      setEmail('');
                      setPassword('');
                    }}
                  >
                    <Text style={styles.userModeButtonText}>← Volver a usuario normal</Text>
                  </TouchableOpacity>
                )}

                {/* Register Link */}
                {loginMode === 'user' && (
                  <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                    <TouchableOpacity onPress={onNavigateRegister}>
                      <Text style={styles.registerLink}>Regístrate gratis</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    marginBottom: 20,
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

  // Forgot Password
  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },

  // Login Button
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
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

  // Register
  registerContainer: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 14,
    color: '#13c1ac',
    fontWeight: '700',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },

  // Admin Mode Button
  adminModeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(90, 103, 216, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(90, 103, 216, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C8FFF',
    letterSpacing: 0.3,
  },

  // User Mode Button
  userModeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userModeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },
});
