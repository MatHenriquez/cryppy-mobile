import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getUserWallets } from '@/services/database';
import { getSecureItem } from '@/services/secureStore';
import { formatBalance, getBalances, payNative } from '@/services/stellar';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function SendScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [balance, setBalance] = useState<string>('0');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWallets();
  }, [user]);

  const loadWallets = async () => {
    if (user?.id) {
      const walletsData = await getUserWallets(user.id);
      setWallets(walletsData);
      if (walletsData.length > 0) {
        setSelectedWallet(walletsData[0]);
        await loadBalance(walletsData[0]);
      }
    }
  };

  const loadBalance = async (wallet: any) => {
    try {
      const balances = await getBalances(wallet.public_key);
      const xlmBalance = balances.find((b: any) => b.asset === 'XLM');
      setBalance(xlmBalance ? xlmBalance.balance : '0');
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance('Error');
    }
  };

  const selectWallet = async (wallet: any) => {
    setSelectedWallet(wallet);
    await loadBalance(wallet);
  };

  const validateAddress = (address: string): boolean => {
    return address.length === 56 && address.startsWith('G');
  };

  const validateAmount = (amt: string): boolean => {
    const num = parseFloat(amt);
    const bal = parseFloat(balance);
    return !isNaN(num) && num > 0 && num <= bal && num >= 0.0000001; // Mínimo 0.1 stroops
  };

  const sendPayment = async () => {
    if (!selectedWallet) {
      Alert.alert('Error', 'Selecciona una wallet primero');
      return;
    }

    if (!validateAddress(destinationAddress)) {
      Alert.alert('Error', 'Dirección de destino inválida. Debe ser una dirección Stellar válida.');
      return;
    }

    if (!validateAmount(amount)) {
      Alert.alert('Error', `Cantidad inválida. Debe ser mayor a 0.0000001 XLM y no exceder tu balance de ${balance} XLM`);
      return;
    }

    Alert.alert(
      'Confirmar Envío',
      `¿Enviar ${amount} XLM a:\n${destinationAddress.substring(0, 20)}...?\n\n${memo ? `Memo: ${memo}\n\n` : ''}Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', style: 'destructive', onPress: executePayment },
      ]
    );
  };

  const executePayment = async () => {
    try {
      setLoading(true);
      
      const privateKey = await getSecureItem(`stellar_secret_${selectedWallet.public_key}`);
      if (!privateKey) {
        Alert.alert('Error', 'No se pudo acceder a la clave privada de la wallet. Asegúrate de que la wallet fue creada correctamente.');
        return;
      }

      const result = await payNative(privateKey, destinationAddress, amount);
      
      Alert.alert(
        'Pago Exitoso',
        `Se envió ${amount} XLM exitosamente.\n\nHash: ${result.hash.substring(0, 20)}...`,
        [
          { text: 'Ver Detalles', onPress: () => console.log('Full result:', result) },
          { text: 'OK', onPress: () => {
            setDestinationAddress('');
            setAmount('');
            setMemo('');
            loadBalance(selectedWallet);
          }}
        ]
      );
      
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        'Error de Pago', 
        error.message || 'No se pudo completar la transacción. Verifica que la cuenta de destino esté activada.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Enviar XLM</ThemedText>
        <ThemedText>Debes iniciar sesión para enviar fondos.</ThemedText>
      </ThemedView>
    );
  }

  if (wallets.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Enviar XLM</ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText type="default" style={styles.emptyText}>
            No tienes wallets disponibles.
          </ThemedText>
          <Button
            title="Crear Wallet"
            onPress={() => router.push("/wallet/create" as any)}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Enviar XLM
        </ThemedText>

        {/* Selector de Wallet */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Desde Wallet:
          </ThemedText>
          {wallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.id}
              style={[
                styles.walletOption,
                selectedWallet?.id === wallet.id && [
                  styles.selectedWallet,
                  { backgroundColor: Colors[colorScheme ?? 'light'].background }
                ],
                { 
                  borderColor: selectedWallet?.id === wallet.id 
                    ? '#007AFF' 
                    : Colors[colorScheme ?? 'light'].tabIconDefault,
                  backgroundColor: selectedWallet?.id === wallet.id 
                    ? Colors[colorScheme ?? 'light'].background
                    : 'transparent'
                }
              ]}
              onPress={() => selectWallet(wallet)}
            >
              <ThemedText type="defaultSemiBold" style={{ color: Colors[colorScheme ?? 'light'].text }}>
                {wallet.alias}
              </ThemedText>
              <ThemedText style={[styles.walletNetwork, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Red: {wallet.network}
              </ThemedText>
              <ThemedText style={[styles.walletBalance, { color: Colors[colorScheme ?? 'light'].text }]}>
                Balance: {selectedWallet?.id === wallet.id ? formatBalance(balance) : '...'} XLM
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {selectedWallet && (
          <>
            {/* Dirección de destino */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Dirección de Destino:
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  }
                ]}
                placeholder="G... (Dirección Stellar de 56 caracteres)"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Cantidad */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Cantidad (XLM):
              </ThemedText>
              <View style={styles.amountContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.amountInput,
                    {
                      backgroundColor: Colors[colorScheme ?? 'light'].background,
                      color: Colors[colorScheme ?? 'light'].text,
                      borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    }
                  ]}
                  placeholder="0.0000000"
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={() => setAmount((parseFloat(balance) - 0.00001).toFixed(7))} // Dejar algo para fee
                >
                  <ThemedText style={styles.maxButtonText}>MAX</ThemedText>
                </TouchableOpacity>
              </View>
              <ThemedText style={[styles.balanceInfo, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Balance disponible: {formatBalance(balance)} XLM
              </ThemedText>
            </View>

            {/* Memo (opcional) */}
            <View style={styles.section}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Memo (Opcional):
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  }
                ]}
                placeholder="Nota o referencia (opcional)"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                value={memo}
                onChangeText={setMemo}
                maxLength={28}
              />
            </View>

            {/* Información de la transacción */}
            <View style={[styles.infoContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              <ThemedText style={[styles.infoTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                💡 Información:
              </ThemedText>
              <ThemedText style={[styles.infoText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                • Fee de red: ~0.00001 XLM
              </ThemedText>
              <ThemedText style={[styles.infoText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                • La transacción es irreversible
              </ThemedText>
              <ThemedText style={[styles.infoText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                • Verifica la dirección antes de enviar
              </ThemedText>
            </View>

            {/* Botón de envío */}
            <View style={styles.buttonContainer}>
              <Button
                title={loading ? "Enviando..." : "Enviar XLM"}
                onPress={sendPayment}
                disabled={loading || !destinationAddress || !amount || parseFloat(balance) <= 0}
              />
            </View>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 16,
  },
  walletOption: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedWallet: {
    borderWidth: 2,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletNetwork: {
    fontSize: 12,
    marginTop: 4,
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    flex: 1,
  },
  maxButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
  },
  maxButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  balanceInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  infoContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  buttonContainer: {
    marginBottom: 40,
  },
});
