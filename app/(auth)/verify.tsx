import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  async function verify() {
    if (code.length !== 6) { Alert.alert('Введите 6-значный код'); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    setLoading(false);
    if (error) { Alert.alert('Неверный код', 'Проверьте SMS и попробуйте снова'); setCode(''); return; }
    router.replace('/(tabs)');
  }

  async function resend() {
    if (timer > 0) return;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (!error) setTimer(60);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>📱</Text>
        <Text style={styles.title}>Введите код</Text>
        <Text style={styles.subtitle}>
          SMS отправлено на{'\n'}<Text style={styles.phone}>{phone}</Text>
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          placeholder="• • • • • •"
          placeholderTextColor={Colors.border}
          returnKeyType="done"
          onSubmitEditing={verify}
        />

        <TouchableOpacity
          style={[styles.btn, code.length < 6 && styles.btnDisabled]}
          onPress={verify}
          disabled={loading || code.length < 6}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Войти</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={resend} disabled={timer > 0}>
          <Text style={[styles.resend, timer > 0 && styles.resendDisabled]}>
            {timer > 0 ? `Повторно через ${timer} с` : 'Отправить код ещё раз'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Изменить номер</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 18, paddingBottom: 40 },
  emoji: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textLight, textAlign: 'center', lineHeight: 22 },
  phone: { fontWeight: '700', color: Colors.text },
  codeInput: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 20,
    fontSize: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
    textAlign: 'center',
    letterSpacing: 14,
    color: Colors.text,
    fontWeight: '700',
  },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 18, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  resend: { textAlign: 'center', color: Colors.primary, fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: Colors.textLight },
  back: { textAlign: 'center', color: Colors.textLight, fontSize: 14 },
});
