import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { saveWalletKeypair } from '@/services/database';
import { setSecureItem } from '@/services/secureStore';
import { createKeypair, fundTestnet } from '@/services/stellar';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export default function CreateWalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateWallet = async () => {
    if (loading) return;
    
    if (!alias.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para tu wallet');
      return;
    }

    setLoading(true);
    try {
      const keypair = createKeypair();
      if (!keypair) {
        throw new Error('Error generando las claves');
      }

      await fundTestnet(keypair.publicKey);

      if (user) {
        await saveWalletKeypair(user.id, keypair.publicKey, keypair.secret, alias, 'testnet');
        Alert.alert(
          'Wallet Creada',
          `Tu wallet "${alias}" ha sido creada y fondeada exitosamente!`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        await setSecureItem(`stellar_secret_${keypair.publicKey}`, keypair.secret);
        Alert.alert(
          'Wallet Temporal Creada',
          `Wallet fondeada exitosamente!\n\nPublic Key: ${keypair.publicKey}\n\nNota: Esta wallet es temporal. Crea una cuenta para guardarla permanentemente.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error creando la wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title">Crear Nueva Wallet</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          {user 
            ? 'Tu wallet será guardada de forma segura en tu cuenta'
            : 'Wallet temporal - no se guardará permanentemente'
          }
        </ThemedText>
        
        <View style={styles.formContainer}>
          <ThemedText type="defaultSemiBold">Nombre de la Wallet</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Ej: Mi Wallet Principal"
            value={alias}
            onChangeText={setAlias}
            maxLength={50}
          />
          
          <ThemedText type="default" style={styles.infoText}>
            • Se creará automáticamente en Testnet
            • Recibirás fondos de prueba (XLM)
            • Las claves se generan de forma segura
          </ThemedText>
          
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Creando...' : 'Crear Wallet'}
              onPress={handleCreateWallet}
              disabled={loading}
            />
          </View>
          
          {!user && (
            <ThemedView style={styles.warningContainer}>
              <ThemedText type="defaultSemiBold" style={styles.warningTitle}>
                ⚠️ Modo Invitado
              </ThemedText>
              <ThemedText type="default" style={styles.warningText}>
                Esta wallet será temporal. Para guardarla permanentemente, 
                crea una cuenta antes de continuar.
              </ThemedText>
              <View style={styles.authButtonsContainer}>
                <Button
                  title="Crear Cuenta"
                  onPress={() => router.push("/auth/register" as any)}
                />
              </View>
            </ThemedView>
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
    marginBottom: 32,
  },
  formContainer: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 24,
  },
  warningContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningTitle: {
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    lineHeight: 18,
  },
  authButtonsContainer: {
    marginTop: 12,
  },
});
