import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      isAvailable: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (error) {
    console.error("Error checking biometric capabilities:", error);
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const capabilities = await getBiometricCapabilities();

    if (!capabilities.hasHardware) {
      Alert.alert(
        "Biometría no disponible",
        "Tu dispositivo no tiene sensores biométricos."
      );
      return false;
    }

    if (!capabilities.isEnrolled) {
      Alert.alert(
        "Configuración requerida",
        "Debes configurar tu huella dactilar o Face ID en la configuración del dispositivo primero."
      );
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verifica tu identidad",
      fallbackLabel: "Usar contraseña",
      disableDeviceFallback: false,
    });

    if (result.success) {
      return true;
    } else {
      console.log("Biometric authentication failed:", result.error);
      return false;
    }
  } catch (error) {
    console.error("Error during biometric authentication:", error);
    Alert.alert("Error", "Hubo un problema con la autenticación biométrica.");
    return false;
  }
}

export function getBiometricTypeText(
  types: LocalAuthentication.AuthenticationType[]
): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "Huella dactilar";
  } else if (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
  ) {
    return "Face ID / Reconocimiento facial";
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "Iris";
  }
  return "Biometría";
}
