import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { authenticateWithBiometrics, getBiometricCapabilities, getBiometricTypeText } from '@/services/biometricAuth';
import { getUserPreferences, updateUserPreferences } from '@/services/database';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Switch, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    notifications_enabled: true,
    biometric_enabled: false,
    default_network: 'testnet',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        const userPrefs = getUserPreferences(user.id);
        if (userPrefs) {
          setPreferences({
            notifications_enabled: Boolean(userPrefs.notifications_enabled),
            biometric_enabled: Boolean(userPrefs.biometric_enabled),
            default_network: userPrefs.default_network,
            currency: 'USD'
          });
        }

        const capabilities = await getBiometricCapabilities();
        setBiometricAvailable(capabilities.isAvailable);
        if (capabilities.supportedTypes.length > 0) {
          setBiometricType(getBiometricTypeText(capabilities.supportedTypes));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const updatePreference = async (key: string, value: any) => {
    if (!user) return;
    
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      updateUserPreferences(user.id, newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'No se pudieron guardar las preferencias');
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!user) return;

    if (value) {
      const capabilities = await getBiometricCapabilities();
      
      if (!capabilities.isAvailable) {
        Alert.alert(
          'Biometría no disponible',
          !capabilities.hasHardware 
            ? 'Tu dispositivo no tiene sensores biométricos.'
            : 'Debes configurar tu huella dactilar o Face ID en la configuración del dispositivo primero.'
        );
        return;
      }

      const authSuccess = await authenticateWithBiometrics();
      if (authSuccess) {
        await updatePreference('biometric_enabled', true);
        Alert.alert(
          'Biometría activada',
          'La autenticación biométrica ha sido activada exitosamente.'
        );
      } else {
        setPreferences(prev => ({ ...prev, biometric_enabled: false }));
      }
    } else {
      await updatePreference('biometric_enabled', false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: () => {
            logout();
            router.replace("/auth" as any);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '⚠️ Esta acción eliminará permanentemente tu cuenta y todas tus wallets. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Funcionalidad pendiente', 'Esta función se implementará próximamente');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="default" style={styles.centerText}>
          Cargando configuración...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Configuración
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="subtitle">Preferencias</ThemedText>
        
        <View style={styles.settingItem}>
          <ThemedText type="default">Notificaciones</ThemedText>
          <Switch
            value={preferences.notifications_enabled}
            onValueChange={(value) => updatePreference('notifications_enabled', value)}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <ThemedText type="default">Autenticación biométrica</ThemedText>
            {biometricType && (
              <ThemedText type="default" style={styles.settingSubtext}>
                {biometricType}
              </ThemedText>
            )}
          </View>
          <Switch
            value={preferences.biometric_enabled}
            onValueChange={handleBiometricToggle}
            disabled={!biometricAvailable}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Red por defecto</ThemedText>
        <ThemedText type="default" style={styles.networkInfo}>
          Actual: {preferences.default_network === 'testnet' ? 'Testnet' : 'Mainnet'}
        </ThemedText>
        <View style={styles.networkButtons}>
          <Button
            title="Testnet"
            onPress={() => updatePreference('default_network', 'testnet')}
          />
          <Button
            title="Mainnet"
            onPress={() => updatePreference('default_network', 'mainnet')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Información de la cuenta</ThemedText>
        <ThemedText type="default">Nombre: {user?.username}</ThemedText>
        <ThemedText type="default">Email: {user?.email}</ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Acciones</ThemedText>
        <View style={styles.actionButtons}>
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
          />
          <Button
            title="Eliminar Cuenta"
            onPress={handleDeleteAccount}
            color="#FF6B6B"
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 50,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  networkInfo: {
    marginBottom: 8,
    color: '#666',
  },
  networkButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtons: {
    gap: 12,
  },
});
