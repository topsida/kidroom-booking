import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';

export default function ProfileScreen() {
  const { profile, isGuest, signOut, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setTelegramId(profile.telegram_chat_id ?? '');
    }
  }, [profile]);

  async function save() {
    setSaving(true);
    await updateProfile({ name: name.trim(), telegram_chat_id: telegramId.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function confirmSignOut() {
    Alert.alert(
      isGuest ? 'Выйти из гостевого режима?' : 'Выйти?',
      isGuest ? 'Гостевой аккаунт будет удалён.' : 'Бронирования сохранятся.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: signOut },
      ]
    );
  }

  const initial = isGuest ? '👤' : (name || profile?.phone || '?')[0].toUpperCase();

  // ── Гостевой режим ──────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Профиль</Text>

        <View style={styles.guestCard}>
          <Text style={styles.guestEmoji}>👤</Text>
          <Text style={styles.guestTitle}>Гостевой режим</Text>
          <Text style={styles.guestSubtitle}>
            Вы вошли без регистрации.{'\n'}
            Бронирования работают, но не сохранятся после выхода.
          </Text>
        </View>

        <View style={styles.guestActions}>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => { signOut(); }}
          >
            <Text style={styles.registerBtnText}>Зарегистрироваться по телефону</Text>
          </TouchableOpacity>
          <Text style={styles.registerHint}>
            После регистрации история броней сохраняется и доступны уведомления в Telegram
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Выйти из гостевого режима</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Обычный профиль ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Профиль</Text>

        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.phone}>{profile?.phone}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Ваше имя</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Например: Анна Иванова"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telegram Chat ID</Text>
            <TextInput
              style={styles.input}
              value={telegramId}
              onChangeText={setTelegramId}
              placeholder="Например: 123456789"
              keyboardType="number-pad"
              placeholderTextColor={Colors.textLight}
            />
            <View style={styles.hintBox}>
              <Text style={styles.hint}>
                💡 Для уведомлений о бронировании. Узнайте ID через бота{' '}
                <Text style={styles.hintBold}>@userinfobot</Text> в Telegram.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={save}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>{saved ? '✓ Сохранено!' : 'Сохранить'}</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },

  // Гость
  guestCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 28,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 8,
  },
  guestEmoji: { fontSize: 52 },
  guestTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  guestSubtitle: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 20 },
  guestActions: { paddingHorizontal: 20, marginTop: 20, gap: 10 },
  registerBtn: { backgroundColor: Colors.primary, borderRadius: 14, padding: 17, alignItems: 'center' },
  registerBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  registerHint: { fontSize: 13, color: Colors.textLight, textAlign: 'center', lineHeight: 18 },

  // Обычный
  avatarCard: { alignItems: 'center', backgroundColor: Colors.white, marginHorizontal: 20, borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 30, fontWeight: '800', color: Colors.primary },
  phone: { fontSize: 17, color: Colors.text, fontWeight: '600' },
  form: { paddingHorizontal: 20, gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text },
  input: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: Colors.border, color: Colors.text },
  hintBox: { backgroundColor: '#F0F4FF', borderRadius: 10, padding: 12 },
  hint: { fontSize: 13, color: Colors.textLight, lineHeight: 20 },
  hintBold: { fontWeight: '700', color: Colors.secondary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  signOutBtn: { margin: 20, marginTop: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.error, padding: 16, alignItems: 'center' },
  signOutText: { color: Colors.error, fontWeight: '600', fontSize: 16 },
});
