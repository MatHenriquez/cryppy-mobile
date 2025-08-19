import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getUserStats, getUserWallets } from '@/services/database';
import { formatBalance, getBalances, getXLMPrice } from '@/services/stellar';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, View } from 'react-native';

export default function DashboardHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const [stats, setStats] = useState({ walletsCount: 0, transactionsCount: 0 });
  const [wallets, setWallets] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userStats = getUserStats(user.id);
      const userWallets = getUserWallets(user.id);
      
      setStats(userStats);
      setWallets(userWallets);
      
      const xlmPrice = await getXLMPrice();
      
      let total = 0;
      for (const wallet of userWallets) {
        try {
          const balances = await getBalances(wallet.public_key);
          const xlmBalance = balances.find((b: any) => b.asset === 'XLM');
          if (xlmBalance) {
            total += parseFloat(xlmBalance.balance);
          }
        } catch (error) {
          console.error(`Error loading balance for ${wallet.alias}:`, error);
        }
      }
      
      setTotalBalance(total);
      setTotalUSD(total * xlmPrice);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserData();
      }
    }, [user, loadUserData])
  );

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          onPress: () => {
            logout();
            router.replace("/auth" as any);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">¡Hola, {user?.username}!</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Bienvenido a tu billetera Stellar
        </ThemedText>
      </ThemedView>

      <ThemedView style={[styles.statsContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ThemedText type="subtitle">Resumen</ThemedText>
        
        {/* Balance Total */}
        <View style={styles.balanceSection}>
          <ThemedText type="title" style={styles.totalBalance}>
            {loading ? '⏳' : formatBalance(totalBalance.toString())} XLM
          </ThemedText>
          <ThemedText style={styles.totalUSD}>
            ≈ ${totalUSD.toFixed(2)} USD
          </ThemedText>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <ThemedText type="title" style={styles.statNumber}>
              {stats.walletsCount}
            </ThemedText>
            <ThemedText type="default">Wallets</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText type="title" style={styles.statNumber}>
              {stats.transactionsCount}
            </ThemedText>
            <ThemedText type="default">Transacciones</ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.actionsContainer}>
        <ThemedText type="subtitle">Acciones Rápidas</ThemedText>
        <View style={styles.buttonGrid}>
          <Button
            title="Crear Wallet"
            onPress={() => router.push("/wallet/create" as any)}
          />
          <Button
            title="Enviar Fondos"
            onPress={() => router.push("/wallet/send" as any)}
          />
          <Button
            title="Ver Wallets"
            onPress={() => router.push("/dashboard/wallets" as any)}
          />
          <Button
            title="Historial"
            onPress={() => router.push("/dashboard/transactions" as any)}
          />
        </View>
      </ThemedView>

      <ThemedView style={styles.recentWallets}>
        <ThemedText type="subtitle">Wallets Recientes</ThemedText>
        {wallets.length > 0 ? (
          wallets.slice(0, 3).map((wallet) => (
            <ThemedView key={wallet.id} style={[styles.walletCard, { borderColor: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              <ThemedText type="defaultSemiBold">{wallet.alias}</ThemedText>
              <ThemedText type="default" style={styles.walletKey}>
                {wallet.public_key.substring(0, 20)}...
              </ThemedText>
              <ThemedText type="default" style={styles.walletNetwork}>
                Red: {wallet.network}
              </ThemedText>
            </ThemedView>
          ))
        ) : (
          <ThemedText type="default" style={styles.emptyText}>
            No tienes wallets aún. ¡Crea tu primera wallet!
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.logoutContainer}>
        <Button title="Cerrar Sesión" onPress={handleLogout} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 8,
  },
  statsContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    marginVertical: 16,
  },
  totalBalance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  totalUSD: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionsContainer: {
    margin: 20,
  },
  buttonGrid: {
    gap: 12,
    marginTop: 16,
  },
  recentWallets: {
    margin: 20,
  },
  walletCard: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  walletKey: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  walletNetwork: {
    fontSize: 12,
    opacity: 0.5,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 16,
  },
  logoutContainer: {
    margin: 20,
    marginTop: 40,
  },
});
