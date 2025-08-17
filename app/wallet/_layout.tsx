import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackButtonMenuEnabled: false,
      }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Wallet',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ title: 'Crear Wallet' }} 
      />
      <Stack.Screen 
        name="send" 
        options={{ title: 'Enviar XLM' }} 
      />
      <Stack.Screen 
        name="receive" 
        options={{ title: 'Recibir Fondos' }} 
      />
    </Stack>
  );
}
