import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [initComplete, setInitComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitComplete(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!initComplete || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/dashboard" as any} />;
  }

  return <Redirect href={"/auth" as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
