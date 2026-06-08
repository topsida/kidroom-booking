import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();

  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('8')) return '+7' + digits.slice(1);
    if (digits.startsWith('7')) return '+' + digits;
    return '+7' + digits;
  }

  async function sendOTP() {
    const formatted = normalizePhone(phone);
    if (formatted.replace(/\D/g, '').length < 11) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) { Alert.alert('Ошибка', error.message); return; }
    router.push({ pathname: '/(auth)/verify', params: { phone: formatted } });
  }

  async function signInAsGuest() {
    setGuestLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    setGuestLoading(false);
    if (error) {
      Alert.alert(
        'Не удалось войти как гость',
        'Включите Anonymous Sign-ins в Supabase:\nAuthentication → Configuration → "Enable anonymous sign-ins"',
      );
    }
    // При успехе useAuth обнаружит сессию и router переключит на /(tabs)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>🎪</Text>
        <Text style={styles.title}>КидРум</Text>
        <Text style={styles.subtitle}>Бронирование детских{'\n'}игровых комнат</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Номер телефона</Text>
          <TextInput
            style={styles.input}
            placeholder="+7 (999) 123-45-67"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={sendOTP}
          />
          <Text style={styles.hint}>Мы отправим SMS с кодом подтверждения</Text>
          <TouchableOpacity
            style={[styles.btn, phone.length < 5 && styles.btnDisabled]}
            onPress={sendOTP}
            disabled={loading || phone.length < 5}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Получить код →</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={signInAsGuest}
          disabled={guestLoading}
        >
          {guestLoading
            ? <ActivityIndicator color={Colors.primary} />
            : <Text style={styles.guestBtnText}>👤 Войти как гость</Text>
          }
        </TouchableOpacity>
        <Text style={styles.guestHint}>Без регистрации — для проверки приложения</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 60 },
  emoji: { fontSize: 72, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 34, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginTop: 8, marginBottom: 44, lineHeight: 24 },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    fontSize: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    color: Colors.text,
  },
  hint: { fontSize: 12, color: Colors.textLight },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 14, color: Colors.textLight },
  guestBtn: {
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  guestBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  guestHint: { textAlign: 'center', fontSize: 12, color: Colors.textLight, marginTop: 8 },
});
