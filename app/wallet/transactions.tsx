import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { formatBalance, getAccountTransactions, getTransactionOperations } from '@/services/stellar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

interface TransactionWithOperations {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  type: string;
  operations: any[];
  memo?: string;
}

export default function WalletTransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const publicKey = params.publicKey as string;
  const [transactions, setTransactions] = useState<TransactionWithOperations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const txs = await getAccountTransactions(publicKey, 50);
      
      const txsWithOperations = await Promise.all(
        txs.map(async (tx) => {
          const operations = await getTransactionOperations(tx.id);
          return {
            ...tx,
            operations
          };
        })
      );
      
      setTransactions(txsWithOperations);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey) {
      loadTransactions();
    }
  }, [publicKey, loadTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionType = (operations: any[], sourceAccount: string) => {
    if (!operations || operations.length === 0) return 'Desconocido';
    
    const operation = operations[0];
    
    switch (operation.type) {
      case 'payment':
        return operation.from === publicKey ? 'Envío' : 'Recibo';
      case 'create_account':
        return 'Creación de cuenta';
      case 'path_payment_strict_receive':
      case 'path_payment_strict_send':
        return 'Intercambio';
      case 'manage_offer':
      case 'create_passive_sell_offer':
        return 'Orden';
      case 'set_options':
        return 'Configuración';
      case 'change_trust':
        return 'Trust Line';
      case 'manage_data':
        return 'Datos';
      default:
        return operation.type || 'Desconocido';
    }
  };

  const getAmount = (operations: any[]) => {
    if (!operations || operations.length === 0) return null;
    
    const operation = operations[0];
    
    if (operation.type === 'payment') {
      return {
        amount: formatBalance(operation.amount),
        asset: operation.asset_type === 'native' ? 'XLM' : operation.asset_code,
        isReceived: operation.to === publicKey
      };
    }
    
    if (operation.type === 'create_account') {
      return {
        amount: formatBalance(operation.starting_balance),
        asset: 'XLM',
        isReceived: operation.account === publicKey
      };
    }
    
    return null;
  };

  const renderTransaction = ({ item }: { item: TransactionWithOperations }) => {
    const amount = getAmount(item.operations);
    const type = getTransactionType(item.operations, item.source_account);
    
    return (
      <TouchableOpacity 
        style={[
          styles.transactionCard,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}
        onPress={() => {
          router.push(`/wallet/transaction-details?hash=${item.hash}` as any);
        }}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <ThemedText type="defaultSemiBold" style={styles.transactionType}>
              {type}
            </ThemedText>
            <ThemedText style={[
              styles.transactionDate,
              { color: Colors[colorScheme ?? 'light'].icon }
            ]}>
              {formatDate(item.created_at)}
            </ThemedText>
          </View>
          
          {amount && (
            <View style={styles.amountContainer}>
              <ThemedText 
                style={[
                  styles.amount,
                  amount.isReceived ? styles.amountReceived : styles.amountSent
                ]}
              >
                {amount.isReceived ? '+' : '-'}{amount.amount} {amount.asset}
              </ThemedText>
            </View>
          )}
        </View>
        
        <View style={[
          styles.transactionDetails,
          { borderTopColor: Colors[colorScheme ?? 'light'].icon }
        ]}>
          <ThemedText style={[
            styles.hash,
            { color: Colors[colorScheme ?? 'light'].icon }
          ]}>
            Hash: {item.hash.substring(0, 20)}...
          </ThemedText>
          
          {item.memo && (
            <ThemedText style={[
              styles.memo,
              { color: Colors[colorScheme ?? 'light'].icon }
            ]}>
              Memo: {item.memo}
            </ThemedText>
          )}
          
          <ThemedText style={styles.status}>
            ✅ Confirmada
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  if (!publicKey) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Error</ThemedText>
        <ThemedText>No se proporcionó una clave pública válida.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[
        styles.header,
        { 
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderBottomColor: Colors[colorScheme ?? 'light'].icon 
        }
      ]}>
        <ThemedText type="title" style={styles.title}>
          Historial de Transacciones
        </ThemedText>
        <ThemedText style={[
          styles.publicKeyDisplay,
          { color: Colors[colorScheme ?? 'light'].icon }
        ]}>
          {publicKey.substring(0, 10)}...{publicKey.substring(publicKey.length - 10)}
        </ThemedText>
      </View>

      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={[
            styles.loadingText,
            { color: Colors[colorScheme ?? 'light'].icon }
          ]}>
            Cargando transacciones...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                📭 No hay transacciones aún
              </ThemedText>
              <ThemedText style={[
                styles.emptySubtext,
                { color: Colors[colorScheme ?? 'light'].icon }
              ]}>
                Las transacciones aparecerán aquí cuando se realicen
              </ThemedText>
            </View>
          )}
          contentContainerStyle={transactions.length === 0 ? styles.emptyList : undefined}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  publicKeyDisplay: {
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  transactionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountReceived: {
    color: '#4caf50',
  },
  amountSent: {
    color: '#f44336',
  },
  transactionDetails: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  hash: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  memo: {
    fontSize: 12,
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: '#4caf50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
