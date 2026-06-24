import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme, ThemeColors } from '@/context/ThemeContext';

export default function LoginScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

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
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.content}>
        <Text style={styles.emoji}>🎪</Text>
        <Text style={styles.title}>КвестРум</Text>
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
            placeholderTextColor={C.textLight}
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

        <TouchableOpacity style={styles.guestBtn} onPress={signInAsGuest} disabled={guestLoading}>
          {guestLoading
            ? <ActivityIndicator color={C.primary} />
            : <Text style={styles.guestBtnText}>👤 Войти как гость</Text>
          }
        </TouchableOpacity>
        <Text style={styles.guestHint}>Без регистрации — для проверки приложения</Text>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    flex: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingTop: 80, paddingBottom: 20 },
    emoji: { fontSize: 72, textAlign: 'center', marginBottom: 8 },
    title: { fontSize: 34, fontWeight: '800', color: C.primary, textAlign: 'center' },
    subtitle: { fontSize: 16, color: C.textLight, textAlign: 'center', marginTop: 8, marginBottom: 44, lineHeight: 24 },
    form: { gap: 12 },
    label: { fontSize: 14, fontWeight: '600', color: C.text },
    input: { backgroundColor: C.white, borderRadius: 14, padding: 18, fontSize: 20, borderWidth: 2, borderColor: C.border, color: C.text },
    hint: { fontSize: 12, color: C.textLight },
    btn: { backgroundColor: C.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 4 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { fontSize: 14, color: C.textLight },
    guestBtn: { borderRadius: 14, padding: 17, alignItems: 'center', borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.white },
    guestBtnText: { color: C.primary, fontSize: 16, fontWeight: '700' },
    guestHint: { textAlign: 'center', fontSize: 12, color: C.textLight, marginTop: 8 },
  });
}
