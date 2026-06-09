import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, THEMES, ThemeId, ThemeColors } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { profile, isGuest, signOut, updateProfile } = useAuth();
  const { colors: C, theme, setTheme } = useTheme();
  const [name, setName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const styles = useMemo(() => makeStyles(C), [C]);

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
          <TouchableOpacity style={styles.registerBtn} onPress={() => { signOut(); }}>
            <Text style={styles.registerBtnText}>Зарегистрироваться по телефону</Text>
          </TouchableOpacity>
          <Text style={styles.registerHint}>
            После регистрации история броней сохраняется и доступны уведомления в Telegram
          </Text>
        </View>

        <ThemePicker currentId={theme.id} onSelect={setTheme} styles={styles} C={C} />

        <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Выйти из гостевого режима</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
              placeholderTextColor={C.textLight}
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
              placeholderTextColor={C.textLight}
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

        <ThemePicker currentId={theme.id} onSelect={setTheme} styles={styles} C={C} />

        <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemePicker({ currentId, onSelect, styles, C }: {
  currentId: ThemeId;
  onSelect: (id: ThemeId) => void;
  styles: ReturnType<typeof makeStyles>;
  C: ThemeColors;
}) {
  return (
    <View style={styles.themeSection}>
      <Text style={styles.themeSectionTitle}>Оформление</Text>
      <View style={styles.themeGrid}>
        {THEMES.map(t => {
          const active = t.id === currentId;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.themeCard, active && { borderColor: C.primary, borderWidth: 2.5 }]}
              onPress={() => onSelect(t.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.themeStrip, { backgroundColor: t.colors.background }]}>
                <View style={[styles.themeAccent, { backgroundColor: t.colors.primary }]} />
                <View style={[styles.themeAccentLight, { backgroundColor: t.colors.primaryLight }]} />
              </View>
              <View style={styles.themeLabel}>
                <Text style={styles.themeEmoji}>{t.emoji}</Text>
                <Text style={[styles.themeName, active && { color: C.primary, fontWeight: '700' }]}>
                  {t.name}
                </Text>
                {active && <Text style={[styles.themeCheck, { color: C.primary }]}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    title: { fontSize: 24, fontWeight: '800', color: C.text, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },

    guestCard: {
      alignItems: 'center',
      backgroundColor: C.white,
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 28,
      borderWidth: 1.5,
      borderColor: C.border,
      borderStyle: 'dashed',
      gap: 8,
    },
    guestEmoji: { fontSize: 52 },
    guestTitle: { fontSize: 18, fontWeight: '800', color: C.text },
    guestSubtitle: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20 },
    guestActions: { paddingHorizontal: 20, marginTop: 20, gap: 10 },
    registerBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 17, alignItems: 'center' },
    registerBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    registerHint: { fontSize: 13, color: C.textLight, textAlign: 'center', lineHeight: 18 },

    avatarCard: { alignItems: 'center', backgroundColor: C.white, marginHorizontal: 20, borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: C.border },
    avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText: { fontSize: 30, fontWeight: '800', color: C.primary },
    phone: { fontSize: 17, color: C.text, fontWeight: '600' },
    form: { paddingHorizontal: 20, gap: 16 },
    field: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: C.text },
    input: { backgroundColor: C.white, borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: C.border, color: C.text },
    hintBox: { backgroundColor: C.primaryLight, borderRadius: 10, padding: 12 },
    hint: { fontSize: 13, color: C.text, lineHeight: 20, opacity: 0.8 },
    hintBold: { fontWeight: '700', color: C.primary },
    saveBtn: { backgroundColor: C.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    signOutBtn: { margin: 20, marginTop: 8, borderRadius: 12, borderWidth: 1.5, borderColor: C.error, padding: 16, alignItems: 'center' },
    signOutText: { color: C.error, fontWeight: '600', fontSize: 16 },

    themeSection: { marginHorizontal: 20, marginTop: 24, marginBottom: 8 },
    themeSectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    themeCard: {
      width: '47%',
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: C.border,
      backgroundColor: C.white,
    },
    themeStrip: { height: 52, flexDirection: 'row', overflow: 'hidden' },
    themeAccent: { width: '40%', height: '100%' },
    themeAccentLight: { flex: 1, height: '100%' },
    themeLabel: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
    themeEmoji: { fontSize: 16 },
    themeName: { flex: 1, fontSize: 13, color: C.text, fontWeight: '500' },
    themeCheck: { fontSize: 14, fontWeight: '700' },
  });
}
