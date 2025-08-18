import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTransactions } from '@/services/database';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      const userTransactions = getUserTransactions(user.id);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <ThemedText type="defaultSemiBold">
          {item.type === 'sent' ? 'Enviado' : 'Recibido'}
        </ThemedText>
        <ThemedText type="default" style={styles.amount}>
          {item.type === 'sent' ? '-' : '+'}{item.amount} XLM
        </ThemedText>
      </View>
      
      <ThemedText type="default" style={styles.address}>
        {item.type === 'sent' ? 'Para: ' : 'De: '}
        {item.type === 'sent' ? item.to_address : item.from_address}
      </ThemedText>
      
      {item.memo && (
        <ThemedText type="default" style={styles.memo}>
          Memo: {item.memo}
        </ThemedText>
      )}
      
      <View style={styles.transactionFooter}>
        <ThemedText type="default" style={styles.date}>
          {new Date(item.created_at).toLocaleString()}
        </ThemedText>
        <ThemedText type="default" style={[
          styles.status,
          { color: item.status === 'confirmed' ? '#4CAF50' : '#FF9800' }
        ]}>
          {item.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
        </ThemedText>
      </View>
      
      {item.transaction_hash && (
        <ThemedText type="default" style={styles.hash}>
          Hash: {item.transaction_hash.substring(0, 20)}...
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Historial de Transacciones
      </ThemedText>

      {loading ? (
        <ThemedText type="default" style={styles.centerText}>
          Cargando transacciones...
        </ThemedText>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText type="default" style={styles.emptyText}>
            No tienes transacciones aún.
          </ThemedText>
          <ThemedText type="default" style={styles.emptySubtext}>
            Tus transacciones aparecerán aquí cuando envíes o recibas XLM.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  },
  listContainer: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  memo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  hash: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});
