import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getUserWallets } from '@/services/database';
import { formatBalance, getBalances, getXLMPrice } from '@/services/stellar';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function WalletsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [wallets, setWallets] = useState<any[]>([]);
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [usdPrices, setUsdPrices] = useState<{ [key: string]: number }>({});
  const [xlmPrice, setXlmPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', 'Dirección copiada al portapapeles');
  };

  const loadWallets = useCallback(async () => {
    if (user?.id) {
      setLoading(true);
      const walletsData = await getUserWallets(user.id);
      setWallets(walletsData);

      const price = await getXLMPrice();
      setXlmPrice(price);

      const newBalances: { [key: string]: string } = {};
      const newUsdPrices: { [key: string]: number } = {};

      for (const wallet of walletsData) {
        try {
          const walletBalances = await getBalances(wallet.public_key);
          const xlmBalance = walletBalances.find((b: { asset: string; balance: string }) => b.asset === 'XLM');
          if (xlmBalance) {
            const balance = parseFloat(xlmBalance.balance);
            newBalances[wallet.public_key] = formatBalance(xlmBalance.balance);
            newUsdPrices[wallet.public_key] = balance * price;
          } else {
            newBalances[wallet.public_key] = '0';
            newUsdPrices[wallet.public_key] = 0;
          }
        } catch (error) {
          console.error(`Error loading balance for ${wallet.public_key}:`, error);
          newBalances[wallet.public_key] = 'Error';
          newUsdPrices[wallet.public_key] = 0;
        }
      }

      setBalances(newBalances);
      setUsdPrices(newUsdPrices);
      setLoading(false);
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
    <View style={[styles.walletCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <View style={styles.walletHeader}>
        <ThemedText type="defaultSemiBold" style={[styles.walletName, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.alias}
        </ThemedText>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => copyToClipboard(item.public_key)}
        >
          <ThemedText style={styles.copyButtonText}>📋 Copiar</ThemedText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => copyToClipboard(item.public_key)}>
        <ThemedText type="default" style={[styles.publicKey, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          {item.public_key}
        </ThemedText>
      </TouchableOpacity>

      <ThemedText type="default" style={[styles.network, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
        Red: {item.network}
      </ThemedText>

      {/* Balance en tiempo real */}
      <View style={styles.balanceContainer}>
        <ThemedText type="defaultSemiBold" style={styles.balance}>
          {balances[item.public_key] || '⏳'} XLM
        </ThemedText>
        {usdPrices[item.public_key] > 0 && (
          <ThemedText style={styles.usdPrice}>
            ≈ ${usdPrices[item.public_key].toFixed(2)} USD
          </ThemedText>
        )}
      </View>

      <ThemedText type="default" style={[styles.date, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
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
        <Button
          title="Historial"
          onPress={() => {
            router.push(`/wallet/transactions?publicKey=${item.public_key}` as any);
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  publicKey: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 4,
  },
  network: {
    fontSize: 14,
    marginTop: 8,
  },
  balanceContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  balance: {
    fontSize: 18,
    color: '#2e7d32',
    marginBottom: 4,
  },
  usdPrice: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
});
