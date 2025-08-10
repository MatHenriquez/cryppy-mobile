import { Buffer } from 'buffer';
import * as Random from 'expo-random';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/useColorScheme';

// Polyfills globales necesarios para libs cripto (stellar-base)
if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = Buffer as any;
// Asegurar crypto.getRandomValues en entornos RN (Hermes) donde no existe
if (typeof (globalThis as any).crypto === 'undefined') (globalThis as any).crypto = {} as any;
if (
  typeof (globalThis as any).crypto.getRandomValues !== 'function' &&
  Platform.OS !== 'web'
) {
  (globalThis as any).crypto.getRandomValues = (arr: Uint8Array) => {
    const bytes = Random.getRandomBytes(arr.length);
    arr.set(bytes);
    return arr;
  };
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider></GestureHandlerRootView>
  );
}
