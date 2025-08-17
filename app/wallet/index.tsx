import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Button, ScrollView, StyleSheet, View } from 'react-native';

export default function WalletIndexScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Modo Invitado</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Puedes probar las funciones básicas sin crear una cuenta
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.actionsContainer}>
        <ThemedText type="subtitle">Acciones Disponibles</ThemedText>
        <View style={styles.buttonGrid}>
          <Button
            title="Crear Wallet Temporal"
            onPress={() => router.push("/wallet/create" as any)}
          />
          <Button
            title="Enviar Fondos"
            onPress={() => router.push("/wallet/send" as any)}
          />
        </View>
      </ThemedView>

      <ThemedView style={[styles.infoContainer, { 
        backgroundColor: colorScheme === 'dark' ? '#1a3a4a' : '#f0f8ff',
        borderColor: colorScheme === 'dark' ? '#4a8cb8' : '#add8e6'
      }]}>
        <ThemedText type="subtitle">💡 Nota Importante</ThemedText>
        <ThemedText type="default" style={styles.infoText}>
          En modo invitado, las wallets no se guardan permanentemente. 
          Para guardar tus wallets de forma segura, crea una cuenta.
        </ThemedText>
        
        <View style={styles.authButtons}>
          <Button
            title="Crear Cuenta"
            onPress={() => router.push("/auth/register" as any)}
          />
          <Button
            title="Iniciar Sesión"
            onPress={() => router.push("/auth/login" as any)}
          />
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
  },
  actionsContainer: {
    margin: 20,
  },
  buttonGrid: {
    gap: 12,
    marginTop: 16,
  },
  infoContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    marginTop: 12,
    lineHeight: 20,
    opacity: 0.8,
  },
  authButtons: {
    marginTop: 16,
    gap: 8,
  },
});
