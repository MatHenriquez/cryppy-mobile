import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button, StyleSheet, View } from 'react-native';

export default function AuthIndexScreen() {
  const router = useRouter();

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
        <ThemedText type="title" style={styles.title}>
          Bienvenido a Cryppy
        </ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Tu billetera Stellar segura y fácil de usar
        </ThemedText>
        
        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              title="Iniciar Sesión"
              onPress={() => router.push("/auth/login" as any)}
            />
          </View>
          
          <View style={styles.buttonWrapper}>
            <Button
              title="Crear Cuenta"
              onPress={() => router.push("/auth/register" as any)}
            />
          </View>
          
          <View style={styles.guestContainer}>
            <ThemedText type="default" style={styles.guestText}>
              O puedes probar sin registrarte:
            </ThemedText>
            <Button
              title="Continuar como invitado"
              onPress={() => router.push("/wallet" as any)}
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
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  guestContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  guestText: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
});
