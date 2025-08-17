import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Buffer } from 'buffer';
import * as Random from 'expo-random';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = Buffer as any;
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
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="wallet" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
