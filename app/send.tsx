import { Alert, Button, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScrollView } from 'react-native-gesture-handler';
import { setSecureItem } from '@/services/secureStore';
import { createKeypair, fundTestnet, getBalances } from '@/services/stellar';
import { useState } from 'react';

export default function TabTwoScreen() {
    const [pub, setPub] = useState<string | null>(null);

    const create = async () => {
        try {
            const kp = createKeypair();
            if (!kp) {
                return;
            }
            await setSecureItem('stellarSecret', kp.secret);
            setPub(kp.publicKey);
            await fundTestnet(kp.publicKey);
            Alert.alert('Account created (testnet)', kp.publicKey);
        } catch (e: any) {
            console.error('Create error:', e);
            Alert.alert('Error creating account', String(e?.message ?? e));
        }
    };

    const balances = async () => {
        if (!pub) return;
        const b = await getBalances(pub);
        Alert.alert('Balances', JSON.stringify(b, null, 2));
    };

    return (
        <ScrollView>
            <ThemedView style={styles.stepContainer}>
                <ThemedText type="subtitle">Stellar (testnet)</ThemedText>
                <Button title="Create account and fund" onPress={create} />
                <Button title="View balances" onPress={balances} disabled={!pub} />
                <ThemedText type="default">Public Key: {pub ?? '—'}</ThemedText>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    stepContainer: {
        gap: 8,
        margin: 8,
    },
});
