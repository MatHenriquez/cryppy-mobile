import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { getBiometricCapabilities, getBiometricTypeText } from '@/services/biometricAuth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, tryBiometricLogin } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');

  useEffect(() => {
    const checkBiometric = async () => {
      const capabilities = await getBiometricCapabilities();
      setBiometricAvailable(capabilities.isAvailable);
      if (capabilities.supportedTypes.length > 0) {
        setBiometricType(getBiometricTypeText(capabilities.supportedTypes));
      }
    };
    checkBiometric();
  }, []);

  const handleLogin = async () => {
    if (loading) return;
    
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      router.replace("/dashboard" as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const success = await tryBiometricLogin();
      if (success) {
        router.replace("/dashboard" as any);
      } else {
        Alert.alert(
          'Autenticación fallida',
          'No se pudo autenticar con biometría. Usa tu contraseña.'
        );
      }
    } catch {
      Alert.alert('Error', 'Error durante la autenticación biométrica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/landing-background.jpg')}
          style={styles.headerImage}
          contentFit="cover"
        />
      }>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Iniciar Sesión</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Accede a tu billetera Stellar
        </ThemedText>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario o email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              onPress={handleLogin}
              disabled={loading}
            />
          </View>

          {biometricAvailable && (
            <TouchableOpacity 
              style={styles.biometricButton} 
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <Ionicons 
                name="finger-print" 
                size={24} 
                color="#007AFF" 
                style={styles.biometricIcon}
              />
              <ThemedText type="default" style={styles.biometricText}>
                Usar {biometricType}
              </ThemedText>
            </TouchableOpacity>
          )}
          
          <View style={styles.linkContainer}>
            <ThemedText type="default" style={styles.linkText}>
              ¿No tienes cuenta?
            </ThemedText>
            <Button
              title="Crear cuenta"
              onPress={() => router.push("/auth/register" as any)}
            />
          </View>
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 8,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginTop: 8,
  },
  biometricIcon: {
    marginRight: 8,
  },
  biometricText: {
    color: '#007AFF',
    fontSize: 16,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
