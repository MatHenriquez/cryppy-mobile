import 'react-native-get-random-values';

import { Image } from 'expo-image';
import { Button, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
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
      <Button title="Continue as a guest" onPress={() => router.push('/send')} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
});
