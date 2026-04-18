import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mapAuthError, signIn } from '@/services/auth';
import { colors } from '@/theme/colors';
import { gradients } from '@/theme/gradients';
import { typography } from '@/theme/typography';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(mapAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={gradients.bgScreen} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kb}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inner}>
            <LinearGradient colors={gradients.brand} style={styles.logo}>
              <Text style={styles.logoText}>DC</Text>
            </LinearGradient>
            <Text style={styles.title}>Datacenter IoT</Text>
            <Text style={styles.subtitle}>Entre para monitorar o datacenter</Text>

            <View style={styles.field}>
              <Ionicons name="mail-outline" size={18} color={colors.textDim} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textDim} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoComplete="password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                onSubmitEditing={handleSubmit}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textDim}
                />
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.button, !canSubmit && styles.buttonDisabled]}>
              <LinearGradient colors={gradients.brand} style={styles.buttonBg}>
                {loading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kb: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center', gap: 14 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoText: { ...typography.h1, color: colors.text },
  title: { ...typography.display, color: colors.text, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textDim, textAlign: 'center', marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
  },
  fieldIcon: { width: 20 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  button: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.5 },
  buttonBg: { paddingVertical: 14, alignItems: 'center' },
  buttonText: { ...typography.bodyStrong, color: colors.text, fontSize: 15 },
});
