import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { getUserWallets } from '@/services/database';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, View } from 'react-native';

export default function WalletsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWallets = useCallback(async () => {
    if (user?.id) {
      const walletsData = await getUserWallets(user.id);
      setWallets(walletsData);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadWallets();
    }, [loadWallets])
  );

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const renderWallet = ({ item }: { item: any }) => (
    <View style={styles.walletCard}>
      <ThemedText type="defaultSemiBold">{item.alias}</ThemedText>
      <ThemedText type="default" style={styles.publicKey}>
        {item.public_key}
      </ThemedText>
      <ThemedText type="default" style={styles.network}>
        Red: {item.network}
      </ThemedText>
      <ThemedText type="default" style={styles.date}>
        Creada: {new Date(item.created_at).toLocaleDateString()}
      </ThemedText>
      
      <View style={styles.walletActions}>
        <Button
          title="Enviar"
          onPress={() => {
            router.push("/wallet/send" as any);
          }}
        />
        <Button
          title="Recibir"
          onPress={() => {
            router.push("/wallet/receive" as any);
          }}
        />
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Mis Wallets
      </ThemedText>
      
      <View style={styles.headerActions}>
        <Button
          title="Crear Nueva Wallet"
          onPress={() => router.push("/wallet/create" as any)}
        />
      </View>

      {loading ? (
        <ThemedText type="default" style={styles.centerText}>
          Cargando wallets...
        </ThemedText>
      ) : wallets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="default" style={styles.emptyText}>
            No tienes wallets aún.
          </ThemedText>
          <ThemedText type="default" style={styles.emptySubtext}>
            Crea tu primera wallet para comenzar a usar Stellar.
          </ThemedText>
          <View style={styles.emptyAction}>
            <Button
              title="Crear Mi Primera Wallet"
              onPress={() => router.push("/wallet/create" as any)}
            />
          </View>
        </View>
      ) : (
        <FlatList
          data={wallets}
          renderItem={renderWallet}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  headerActions: {
    marginBottom: 20,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
  },
  emptyAction: {
    minWidth: 200,
  },
  listContainer: {
    paddingBottom: 20,
  },
  walletCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  publicKey: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  network: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
