import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { getUserWallets } from '@/services/database';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';

export default function ReceiveScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const userWallets = getUserWallets(user.id);
      setWallets(userWallets);

      if (params.publicKey && userWallets.length > 0) {
        const wallet = userWallets.find(w => w.public_key === params.publicKey);
        if (wallet) {
          setSelectedWallet(wallet);
        }
      } else if (userWallets.length > 0) {
        setSelectedWallet(userWallets[0]);
      }
    }
  }, [user, params.publicKey]);

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('¡Copiado!', 'La dirección se copió al portapapeles');
    } catch {
      Alert.alert('Error', 'No se pudo copiar la dirección');
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="default">
          Debes iniciar sesión para ver tus wallets
        </ThemedText>
      </ThemedView>
    );
  }

  if (wallets.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Recibir Fondos</ThemedText>
        <View style={styles.emptyContainer}>
          <ThemedText type="default" style={styles.emptyText}>
            No tienes wallets creadas aún.
          </ThemedText>
          <ThemedText type="default" style={styles.emptySubtext}>
            Crea una wallet para poder recibir fondos.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Recibir Fondos
      </ThemedText>

      {wallets.length > 1 && (
        <View style={styles.walletSelector}>
          <ThemedText type="subtitle">Selecciona una wallet:</ThemedText>
          {wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletOption}>
              <Button
                title={`${wallet.alias} (${wallet.network})`}
                onPress={() => setSelectedWallet(wallet)}
                color={selectedWallet?.id === wallet.id ? '#007AFF' : '#8E8E93'}
              />
            </View>
          ))}
        </View>
      )}

      {selectedWallet && (
        <View style={styles.walletInfo}>
          <ThemedText type="subtitle" style={styles.walletTitle}>
            {selectedWallet.alias}
          </ThemedText>
          <ThemedText type="default" style={styles.networkBadge}>
            Red: {selectedWallet.network}
          </ThemedText>

          <View style={styles.addressContainer}>
            <ThemedText type="default" style={styles.addressLabel}>
              Dirección pública:
            </ThemedText>
            <View style={styles.addressBox}>
              <ThemedText type="default" style={styles.address}>
                {selectedWallet.public_key}
              </ThemedText>
            </View>
            <Button
              title="Copiar Dirección"
              onPress={() => copyToClipboard(selectedWallet.public_key)}
            />
          </View>

          <View style={styles.instructionsContainer}>
            <ThemedText type="subtitle">Instrucciones:</ThemedText>
            <ThemedText type="default" style={styles.instruction}>
              1. Comparte esta dirección con quien te va a enviar fondos
            </ThemedText>
            <ThemedText type="default" style={styles.instruction}>
              2. Asegúrate de que use la red correcta ({selectedWallet.network})
            </ThemedText>
            <ThemedText type="default" style={styles.instruction}>
              3. Los fondos aparecerán en tu wallet una vez confirmada la transacción
            </ThemedText>
          </View>

          <View style={styles.warningContainer}>
            <ThemedText type="default" style={styles.warningText}>
              ⚠️ Solo envía activos Stellar (XLM) a esta dirección. 
              Enviar otros tipos de criptomonedas resultará en pérdida permanente.
            </ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  walletSelector: {
    marginBottom: 24,
  },
  walletOption: {
    marginVertical: 4,
  },
  walletInfo: {
    flex: 1,
  },
  walletTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  networkBadge: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  addressContainer: {
    marginBottom: 24,
  },
  addressLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  addressBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instruction: {
    marginBottom: 8,
    lineHeight: 20,
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningText: {
    color: '#F57C00',
    fontSize: 14,
    lineHeight: 18,
  },
});
