import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getUserWallets } from '@/services/database';
import { getAccountTransactions, getTransactionOperations, formatBalance } from '@/services/stellar';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      const userWallets = getUserWallets(user.id);
      const allTransactions: any[] = [];

      for (const wallet of userWallets) {
        if (wallet.is_active) {
          try {
            const walletTransactions = await getAccountTransactions(wallet.public_key, 20);
            
            for (const tx of walletTransactions) {
              const operations = await getTransactionOperations(tx.id);
              allTransactions.push({
                ...tx,
                wallet_alias: wallet.alias,
                wallet_public_key: wallet.public_key,
                operations: operations
              });
            }
          } catch (error) {
            console.error(`Error loading transactions for wallet ${wallet.public_key}:`, error);
          }
        }
      }

      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTransactions(allTransactions);
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

  const getTransactionType = (operations: any[], sourceAccount: string, walletPublicKey: string) => {
    if (!operations || operations.length === 0) return 'Desconocido';
    
    const operation = operations[0];
    
    switch (operation.type) {
      case 'payment':
        return operation.from === walletPublicKey ? 'Envío' : 'Recibo';
      case 'create_account':
        return 'Creación de cuenta';
      case 'path_payment_strict_receive':
      case 'path_payment_strict_send':
        return 'Intercambio';
      default:
        return operation.type || 'Desconocido';
    }
  };

  const getAmount = (operations: any[], walletPublicKey: string) => {
    if (!operations || operations.length === 0) return null;
    
    const operation = operations[0];
    
    if (operation.type === 'payment') {
      return {
        amount: formatBalance(operation.amount),
        asset: operation.asset_type === 'native' ? 'XLM' : operation.asset_code,
        isReceived: operation.to === walletPublicKey
      };
    }
    
    if (operation.type === 'create_account') {
      return {
        amount: formatBalance(operation.starting_balance),
        asset: 'XLM',
        isReceived: operation.account === walletPublicKey
      };
    }
    
    return null;
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const amountInfo = getAmount(item.operations, item.wallet_public_key);
    const type = getTransactionType(item.operations, item.source_account, item.wallet_public_key);
    
    return (
      <View style={[
        styles.transactionCard,
        { 
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault 
        }
      ]}>
        <View style={styles.transactionHeader}>
          <ThemedText type="defaultSemiBold">
            {type}
          </ThemedText>
          {amountInfo && (
            <ThemedText type="default" style={[
              styles.amount,
              { color: amountInfo.isReceived ? '#4CAF50' : '#F44336' }
            ]}>
              {amountInfo.isReceived ? '+' : '-'}{amountInfo.amount} {amountInfo.asset}
            </ThemedText>
          )}
        </View>
        
        <ThemedText type="default" style={[
          styles.walletInfo,
          { color: Colors[colorScheme ?? 'light'].icon }
        ]}>
          Wallet: {item.wallet_alias}
        </ThemedText>
        
        {item.operations && item.operations[0] && (
          <ThemedText type="default" style={[
            styles.address,
            { color: Colors[colorScheme ?? 'light'].icon }
          ]}>
            {item.operations[0].type === 'payment' ? (
              <>
                {item.operations[0].from === item.wallet_public_key ? 'Para: ' : 'De: '}
                {item.operations[0].from === item.wallet_public_key 
                  ? item.operations[0].to?.substring(0, 20) + '...'
                  : item.operations[0].from?.substring(0, 20) + '...'
                }
              </>
            ) : (
              'Cuenta: ' + item.wallet_public_key.substring(0, 20) + '...'
            )}
          </ThemedText>
        )}
        
        {item.memo && (
          <ThemedText type="default" style={[
            styles.memo,
            { color: Colors[colorScheme ?? 'light'].icon }
          ]}>
            Memo: {item.memo}
          </ThemedText>
        )}
        
        <View style={styles.transactionFooter}>
          <ThemedText type="default" style={[
            styles.date,
            { color: Colors[colorScheme ?? 'light'].tabIconDefault }
          ]}>
            {new Date(item.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </ThemedText>
          <ThemedText type="default" style={[
            styles.status,
            { color: '#4CAF50' }
          ]}>
            Confirmado
          </ThemedText>
        </View>
        
        {item.hash && (
          <ThemedText type="default" style={[
            styles.hash,
            { color: Colors[colorScheme ?? 'light'].tabIconDefault }
          ]}>
            Hash: {item.hash.substring(0, 20)}...
          </ThemedText>
        )}
      </View>
    );
  };

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
          keyExtractor={(item) => `${item.hash}-${item.wallet_public_key}`}
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
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
  walletInfo: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  memo: {
    fontSize: 14,
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
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  hash: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 4,
  },
});
