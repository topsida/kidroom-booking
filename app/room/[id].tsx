import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, FlatList, Image, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView,
  Platform, Modal, TouchableWithoutFeedback, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { Room, Quest, Review, Genre, Difficulty } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { StarRating } from '@/components/StarRating';
import { useFavorites } from '@/context/FavoritesContext';

const W = Dimensions.get('window').width;

// ── визуальные словари ────────────────────────────────────────────────────────

const HAT = require('../../assets/adaptive-icon.png');

const GENRE_META: Record<Genre, { emoji: string; hatIcon?: true; bg: string }> = {
  'хоррор':     { emoji: '👻', bg: '#7B1010' },
  'детектив':   { emoji: '🔍', bg: '#1A3A5C' },
  'приключение':{ emoji: '⚔️', bg: '#1A5C2A' },
  'детский':    { emoji: '🎈', bg: '#C04A00' },
  'VR':         { emoji: '🥽', bg: '#4A0E8F' },
  'перформанс': { emoji: '', hatIcon: true, bg: '#8F0E6A' },
};

const DIFF_COLOR: Record<Difficulty, string> = {
  'новичок': '#1A8A3A',
  'средний': '#B06000',
  'опытный': '#B01010',
};

const RATING_CAPTIONS: Record<number, string> = {
  1: 'Ужасно 😞', 2: 'Плохо 😕', 3: 'Нормально 😐', 4: 'Хорошо 😊', 5: 'Отлично! 🎉',
};

// ── галерея фотографий квеста ─────────────────────────────────────────────────

const SW = Dimensions.get('window').width;

function PhotoGallery({ photos }: { photos: string[] }) {
  const [visible, setVisible]   = useState(false);
  const [initIdx, setInitIdx]   = useState(0);
  const [curIdx,  setCurIdx]    = useState(0);
  const listRef = useRef<FlatList>(null);

  function open(idx: number) {
    setInitIdx(idx);
    setCurIdx(idx);
    setVisible(true);
  }

  return (
    <>
      {/* Горизонтальная полоса превью */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={gS.strip}
      >
        {photos.map((uri, i) => (
          <TouchableOpacity key={i} onPress={() => open(i)} activeOpacity={0.85}>
            <Image source={{ uri }} style={gS.thumb} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Полноэкранный просмотр */}
      <Modal
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        statusBarTranslucent
      >
        <View style={gS.modalBg}>
          <FlatList
            ref={listRef}
            data={photos}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initIdx}
            getItemLayout={(_, i) => ({ length: SW, offset: SW * i, index: i })}
            onLayout={() => {
              if (initIdx > 0) {
                listRef.current?.scrollToOffset({ offset: initIdx * SW, animated: false });
              }
            }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
              setCurIdx(idx);
            }}
            renderItem={({ item }) => (
              <View style={gS.slide}>
                <Image source={{ uri: item }} style={gS.fullImg} resizeMode="contain" />
              </View>
            )}
          />

          {/* Крестик */}
          <TouchableOpacity
            style={gS.closeBtn}
            onPress={() => setVisible(false)}
            hitSlop={12}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Счётчик */}
          <View style={gS.counter}>
            <Text style={gS.counterText}>{curIdx + 1} / {photos.length}</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const gS = StyleSheet.create({
  strip:       { gap: 4 },
  thumb:       { width: 130, height: 150 },
  modalBg:     { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  slide:       { width: SW, justifyContent: 'center', alignItems: 'center' },
  fullImg:     { width: SW, height: SW },
  closeBtn: {
    position: 'absolute', top: 52, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  counter: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  counterText: { color: '#fff', fontSize: 14 },
});

// ── карточка одного квеста ────────────────────────────────────────────────────

function QuestCard({ quest, colors: C }: { quest: Quest; colors: ThemeColors }) {
  const router = useRouter();
  const genre = quest.genre ? GENRE_META[quest.genre] : null;
  const diffColor = quest.difficulty ? DIFF_COLOR[quest.difficulty] : undefined;
  const scary = quest.is_scary && quest.is_scary !== 'нет' ? quest.is_scary : null;

  const photos = (quest.photos && quest.photos.length > 0)
    ? quest.photos
    : ['https://placehold.co/400x160/1A3A5C/FFFFFF?text=Квест'];

  const s = useMemo(() => questStyles(C), [C]);

  return (
    <View style={s.card}>
      {/* Горизонтальная галерея фото + бейдж жанра */}
      <View>
        <PhotoGallery photos={photos} />
        {genre && (
          <View style={[s.genreBadge, { backgroundColor: genre.bg }]}>
            {genre.hatIcon
              ? <View style={s.genreBadgeRow}>
                  <Image source={HAT} style={s.genreHat} resizeMode="contain" />
                  <Text style={s.genreText}>{quest.genre}</Text>
                </View>
              : <Text style={s.genreText}>{genre.emoji} {quest.genre}</Text>
            }
          </View>
        )}
      </View>

      <View style={s.body}>
        {/* Название */}
        <Text style={s.name}>{quest.name}</Text>

        {/* Описание */}
        {quest.description ? (
          <Text style={s.desc} numberOfLines={2}>{quest.description}</Text>
        ) : null}

        {/* Характеристики */}
        <View style={s.specsRow}>
          {quest.duration_minutes != null && (
            <View style={s.spec}>
              <Ionicons name="time-outline" size={13} color={C.textLight} />
              <Text style={s.specText}>{quest.duration_minutes} мин</Text>
            </View>
          )}
          {quest.min_players != null && quest.max_players != null && (
            <View style={s.spec}>
              <Ionicons name="people-outline" size={13} color={C.textLight} />
              <Text style={s.specText}>{quest.min_players}–{quest.max_players} чел</Text>
            </View>
          )}
          {quest.difficulty && diffColor && (
            <View style={[s.diffBadge, { backgroundColor: diffColor + '1A' }]}>
              <Text style={[s.diffText, { color: diffColor }]}>{quest.difficulty}</Text>
            </View>
          )}
        </View>

        {/* Теги */}
        {(quest.age_limit || quest.has_actor || scary) ? (
          <View style={s.tagsRow}>
            {quest.age_limit && (
              <View style={s.tag}><Text style={s.tagText}>{quest.age_limit}</Text></View>
            )}
            {quest.has_actor && (
              <View style={[s.tag, { backgroundColor: C.primaryLight, borderColor: C.primary }]}>
                <View style={s.tagRow}>
                  <Image source={HAT} style={s.tagHat} resizeMode="contain" />
                  <Text style={[s.tagText, { color: C.primary }]}>Актёр</Text>
                </View>
              </View>
            )}
            {scary === 'немного' && (
              <View style={[s.tag, { backgroundColor: '#FFF0E0', borderColor: '#E07000' }]}>
                <Text style={[s.tagText, { color: '#9A4F00' }]}>😨 Немного страшно</Text>
              </View>
            )}
            {scary === 'хоррор' && (
              <View style={[s.tag, { backgroundColor: '#FFE4E4', borderColor: '#FF6666' }]}>
                <Text style={[s.tagText, { color: '#B01010' }]}>💀 Хоррор</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Цена + кнопка */}
        <View style={s.footer}>
          <View>
            <Text style={s.price}>{quest.price_per_team.toLocaleString('ru-RU')} ₽</Text>
            <Text style={s.perLabel}>за команду</Text>
          </View>
          <TouchableOpacity
            style={s.bookBtn}
            onPress={() => router.push({
              pathname: '/booking/[questId]',
              params: { questId: quest.id },
            })}
            activeOpacity={0.85}
          >
            <Text style={s.bookBtnText}>Забронировать</Text>
            <Ionicons name="arrow-forward" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function questStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.white, borderRadius: 16,
      overflow: 'hidden', borderWidth: 1.5, borderColor: C.border,
      elevation: 6,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 10,
      marginBottom: 8,
	    },
    photo: { width: '100%', height: 150 },
    genreBadge: {
      position: 'absolute', top: 10, left: 10,
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    genreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    genreBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    genreHat: { width: 14, height: 14 },
    body: { padding: 14, gap: 8 },
    name: { fontSize: 18, fontWeight: '800', color: C.text },
    desc: { fontSize: 13, color: C.textLight, lineHeight: 19 },
    specsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    specText: { fontSize: 13, color: C.textLight },
    diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    diffText: { fontSize: 12, fontWeight: '600' },
    tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.background },
    tagText: { fontSize: 12, fontWeight: '600', color: C.text },
    tagRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tagHat: { width: 14, height: 14 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    price: { fontSize: 22, fontWeight: '800', color: C.primary },
    perLabel: { fontSize: 12, color: C.textLight },
    bookBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    },
    bookBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  });
}

// ── главный экран организации ─────────────────────────────────────────────────

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [room, setRoom] = useState<Room | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoErrors, setPhotoErrors] = useState<Record<number, boolean>>({});
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [roomRes, questsRes, reviewsRes, authRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', id).single(),
        supabase.from('quests').select('*').eq('room_id', id).eq('is_active', true).order('price_per_team'),
        supabase.from('reviews').select('*, users(name)').eq('room_id', id).order('created_at', { ascending: false }),
        supabase.auth.getUser(),
      ]);

      setRoom(roomRes.data);
      setQuests(questsRes.data ?? []);

      const allReviews = reviewsRes.data ?? [];
      setReviews(allReviews);

      const user = authRes.data.user;
      if (user) {
        setUserId(user.id);
        setIsGuest(user.is_anonymous === true);
        const mine = allReviews.find(r => r.user_id === user.id) ?? null;
        setMyReview(mine);
        if (mine) { setRating(mine.rating); setComment(mine.comment ?? ''); }
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function reloadReviews() {
    const { data } = await supabase.from('reviews').select('*, users(name)').eq('room_id', id).order('created_at', { ascending: false });
    const all = data ?? [];
    setReviews(all);
    if (userId) setMyReview(all.find(r => r.user_id === userId) ?? null);
  }

  async function submitReview() {
    if (rating === 0) { Alert.alert('Выберите оценку'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').upsert(
      { room_id: id, user_id: userId, rating, comment: comment.trim() },
      { onConflict: 'room_id,user_id' },
    );
    setSubmitting(false);
    if (error) { Alert.alert('Ошибка', error.message); return; }
    await reloadReviews();
    setEditing(false);
  }

  async function deleteReview() {
    Alert.alert('Удалить отзыв?', undefined, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        await supabase.from('reviews').delete().eq('room_id', id).eq('user_id', userId!);
        setMyReview(null); setRating(0); setComment(''); setEditing(false);
        reloadReviews();
      }},
    ]);
  }

  function handleAddressTap() {
    Alert.alert(room!.address, undefined, [
      { text: 'Скопировать адрес', onPress: () => Clipboard.setStringAsync(room!.address) },
      { text: 'Открыть в навигаторе', onPress: () => setMapPickerVisible(true) },
      { text: 'Отмена', style: 'cancel' },
    ]);
  }

  async function launchYandex() {
    setMapPickerVisible(false);
    if (!room) return;
    const scheme = room.latitude && room.longitude
      ? `yandexmaps://maps.yandex.ru/?rtext=~${room.latitude},${room.longitude}&rtt=auto`
      : `yandexmaps://maps.yandex.ru/?text=${encodeURIComponent(room.address)}`;
    const web = room.latitude && room.longitude
      ? `https://maps.yandex.ru/?rtext=~${room.latitude},${room.longitude}&rtt=auto`
      : `https://maps.yandex.ru/?text=${encodeURIComponent(room.address)}`;
    Linking.openURL((await Linking.canOpenURL(scheme)) ? scheme : web);
  }

  async function launchGoogle() {
    setMapPickerVisible(false);
    if (!room) return;
    const query = room.latitude && room.longitude ? `${room.latitude},${room.longitude}` : encodeURIComponent(room.address);
    const scheme = `comgooglemaps://?daddr=${query}&directionsmode=driving`;
    const web = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    Linking.openURL((await Linking.canOpenURL(scheme)) ? scheme : web);
  }

  if (loading || !room) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const otherReviews = reviews.filter(r => r.user_id !== userId);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Фотогалерея организации */}
        {room.photos.length === 0 ? (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={36} color="rgba(255,255,255,0.55)" />
            <Text style={styles.photoPlaceholderText}>{room.name}</Text>
          </View>
        ) : (
          <View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / W))}>
              {room.photos.map((uri, i) =>
                photoErrors[i] ? (
                  <View key={i} style={[styles.photoPlaceholder, { width: W }]}>
                    <Ionicons name="camera-outline" size={36} color="rgba(255,255,255,0.55)" />
                  </View>
                ) : (
                  <Image key={i} source={{ uri }} style={[styles.photo, { width: W }]} resizeMode="cover"
                    onError={() => setPhotoErrors(prev => ({ ...prev, [i]: true }))} />
                )
              )}
            </ScrollView>
            {room.photos.length > 1 && (
              <View style={styles.dots}>
                {room.photos.map((_, i) => (
                  <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>

          {/* Заголовок организации */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{room.name}</Text>
            <View style={styles.titleActions}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color={C.star} />
                <Text style={styles.ratingText}>{room.rating.toFixed(1)}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(room.id)} hitSlop={8} activeOpacity={0.7}>
                <Ionicons
                  name={isFavorite(room.id) ? 'heart' : 'heart-outline'}
                  size={26}
                  color={isFavorite(room.id) ? '#FF6B9D' : C.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.infoRow} onPress={handleAddressTap} activeOpacity={0.7}>
            <Ionicons name="location" size={15} color={C.primary} />
            <Text style={[styles.infoText, styles.infoTextLink]}>{room.address}</Text>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={15} color={C.primary} />
            <Text style={styles.infoText}>
              Работает {room.working_hours_start.slice(0, 5)} — {room.working_hours_end.slice(0, 5)}
            </Text>
          </View>

          {room.description ? (
            <Text style={styles.description}>{room.description}</Text>
          ) : null}

          {/* ── Список квестов ── */}
          <View style={styles.questsHeader}>
            <Text style={styles.sectionTitle}>Квесты</Text>
            {quests.length > 0 && (
              <View style={styles.questCountBadge}>
                <Text style={styles.questCountText}>{quests.length}</Text>
              </View>
            )}
          </View>

          {quests.length === 0 ? (
            <View style={styles.emptyQuests}>
              <Text style={styles.emptyQuestsText}>Квесты скоро появятся</Text>
            </View>
          ) : (
            <View style={styles.questsList}>
              {quests.map(q => (
                <QuestCard key={q.id} quest={q} colors={C} />
              ))}
            </View>
          )}

          {/* ── Отзывы ── */}
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>
              Отзывы{reviews.length > 0 ? ` (${reviews.length})` : ''}
            </Text>
            {reviews.length > 0 && (
              <View style={styles.avgBadge}>
                <Ionicons name="star" size={13} color={C.star} />
                <Text style={styles.avgText}>{room.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {!userId || isGuest ? (
            <View style={styles.authHint}>
              <Ionicons name="person-circle-outline" size={20} color={C.textLight} />
              <Text style={styles.authHintText}>Войдите в аккаунт, чтобы оставить отзыв</Text>
            </View>
          ) : myReview && !editing ? (
            <View style={styles.myReviewCard}>
              <View style={styles.myReviewTop}>
                <Text style={styles.myReviewLabel}>Ваш отзыв</Text>
                <View style={styles.myReviewActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} hitSlop={8}>
                    <Ionicons name="pencil-outline" size={15} color={C.primary} />
                    <Text style={[styles.editBtnText, { color: C.primary }]}>Изменить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={deleteReview} hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color={C.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <StarRating value={myReview.rating} size={20} />
              {myReview.comment ? <Text style={styles.myReviewComment}>{myReview.comment}</Text> : null}
              <Text style={styles.reviewDate}>
                {new Date(myReview.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{myReview ? 'Редактировать отзыв' : 'Оставить отзыв'}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Ваша оценка</Text>
                <StarRating value={rating} size={32} onSelect={setRating} />
              </View>
              {rating > 0 && <Text style={styles.ratingCaption}>{RATING_CAPTIONS[rating]}</Text>}
              <TextInput
                style={styles.commentInput}
                placeholder="Комментарий (необязательно)"
                placeholderTextColor={C.textLight}
                value={comment}
                onChangeText={setComment}
                multiline numberOfLines={3}
                textAlignVertical="top" maxLength={500}
              />
              <View style={styles.formActions}>
                {editing && (
                  <TouchableOpacity style={styles.cancelBtn}
                    onPress={() => { setEditing(false); setRating(myReview!.rating); setComment(myReview!.comment ?? ''); }}>
                    <Text style={[styles.cancelBtnText, { color: C.textLight }]}>Отмена</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: rating === 0 ? C.border : C.primary }, submitting && { opacity: 0.6 }]}
                  onPress={submitReview} disabled={submitting || rating === 0} activeOpacity={0.85}>
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitBtnText}>{myReview ? 'Сохранить' : 'Отправить отзыв'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {otherReviews.length === 0 && !myReview && (
            <View style={styles.noReviewsBox}>
              <Text style={styles.noReviews}>Пока нет отзывов. Будьте первым!</Text>
            </View>
          )}

          {otherReviews.map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAuthorRow}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{(r.users?.name || 'Г')[0].toUpperCase()}</Text>
                  </View>
                  <Text style={styles.reviewAuthor}>{r.users?.name || 'Гость'}</Text>
                </View>
                <StarRating value={r.rating} size={14} />
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              <Text style={styles.reviewDate}>
                {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          ))}

          <View style={{ height: insets.bottom + 20 }} />
        </View>

      </ScrollView>

      {/* Диалог выбора навигатора */}
      <Modal transparent visible={mapPickerVisible} animationType="fade" onRequestClose={() => setMapPickerVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMapPickerVisible(false)}>
          <View style={styles.pickerBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.pickerDialog}>
          <Text style={styles.pickerTitle}>Открыть в навигаторе</Text>
          <TouchableOpacity style={styles.pickerRow} onPress={launchYandex} activeOpacity={0.75}>
            <Image source={require('@/assets/yandex-maps.png')} style={styles.pickerIcon} />
            <Text style={styles.pickerLabel}>Яндекс Карты</Text>
            <Ionicons name="chevron-forward" size={18} color={C.border} />
          </TouchableOpacity>
          <View style={styles.pickerDivider} />
          <TouchableOpacity style={styles.pickerRow} onPress={launchGoogle} activeOpacity={0.75}>
            <Image source={{ uri: 'https://maps.gstatic.com/favicon3.ico' }} style={styles.pickerIcon} />
            <Text style={styles.pickerLabel}>Google Maps</Text>
            <Ionicons name="chevron-forward" size={18} color={C.border} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerCancel} onPress={() => setMapPickerVisible(false)}>
            <Text style={[styles.pickerCancelText, { color: C.textLight }]}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

    photo: { height: 270 },
    photoPlaceholder: {
      height: 160, width: W, backgroundColor: C.primary,
      justifyContent: 'center', alignItems: 'center', gap: 10,
    },
    photoPlaceholderText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20 },
    dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: '#fff', width: 22 },

    content: { padding: 20, gap: 14 },

    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontSize: 22, fontWeight: '800', color: C.text, flex: 1, marginRight: 8 },
    titleActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#9A7000' },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 14, color: C.textLight, flex: 1 },
    infoTextLink: { color: C.primary, textDecorationLine: 'underline' },

    description: { fontSize: 15, color: C.text, lineHeight: 23 },

    questsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    questCountBadge: { backgroundColor: C.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    questCountText: { fontSize: 13, fontWeight: '700', color: C.primary },

    questsList: { gap: 20 },
    emptyQuests: { backgroundColor: C.white, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    emptyQuestsText: { color: C.textLight, fontSize: 14 },

    reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    avgBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    avgText: { fontSize: 13, fontWeight: '700', color: '#9A7000' },

    authHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
    authHintText: { fontSize: 14, color: C.textLight },

    myReviewCard: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1.5, borderColor: C.primary },
    myReviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    myReviewLabel: { fontSize: 13, fontWeight: '700', color: C.primary },
    myReviewActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    editBtnText: { fontSize: 13, fontWeight: '600' },
    myReviewComment: { fontSize: 14, color: C.text, lineHeight: 20 },

    formCard: { backgroundColor: C.white, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1.5, borderColor: C.border },
    formTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ratingLabel: { fontSize: 14, color: C.text, fontWeight: '500' },
    ratingCaption: { fontSize: 13, color: C.textLight, marginTop: -6 },
    commentInput: { backgroundColor: C.background, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, padding: 12, fontSize: 14, color: C.text, minHeight: 80 },
    formActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 4 },
    cancelBtnText: { fontSize: 14, fontWeight: '600' },
    submitBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    noReviewsBox: { backgroundColor: C.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
    noReviews: { color: C.textLight, fontSize: 14, fontStyle: 'italic' },
    reviewCard: { backgroundColor: C.white, borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: C.border },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center' },
    reviewAvatarText: { fontSize: 13, fontWeight: '700', color: C.primary },
    reviewAuthor: { fontWeight: '700', color: C.text, fontSize: 14 },
    reviewComment: { fontSize: 14, color: C.text, lineHeight: 20 },
    reviewDate: { fontSize: 12, color: C.textLight },

    pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    pickerDialog: { position: 'absolute', bottom: 32, left: 20, right: 20, backgroundColor: C.white, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    pickerTitle: { fontSize: 13, fontWeight: '600', color: C.textLight, textAlign: 'center', paddingTop: 16, paddingBottom: 8 },
    pickerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
    pickerIcon: { width: 24, height: 24, borderRadius: 6 },
    pickerLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: C.text },
    pickerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 20 },
    pickerCancel: { padding: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, marginTop: 4 },
    pickerCancelText: { fontSize: 15, fontWeight: '600' },
  });
}
