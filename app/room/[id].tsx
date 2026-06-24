import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, TouchableOpacity,
  Dimensions, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView,
  Platform, Modal, TouchableWithoutFeedback, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';
import { Room, Review } from '@/types';
import { useTheme, ThemeColors } from '@/context/ThemeContext';
import { StarRating } from '@/components/StarRating';
import { useFavorites } from '@/context/FavoritesContext';

const W = Dimensions.get('window').width;

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: C } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { isFavorite, toggleFavorite } = useFavorites();

  const [room, setRoom] = useState<Room | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  // Текущий пользователь
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Состояние формы отзыва
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [roomRes, reviewsRes, authRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', id).single(),
        supabase.from('reviews').select('*, users(name)').eq('room_id', id).order('created_at', { ascending: false }),
        supabase.auth.getUser(),
      ]);

      setRoom(roomRes.data);
      const allReviews = reviewsRes.data ?? [];
      setReviews(allReviews);

      const user = authRes.data.user;
      if (user) {
        setUserId(user.id);
        setIsGuest(user.is_anonymous === true);
        const mine = allReviews.find(r => r.user_id === user.id) ?? null;
        setMyReview(mine);
        if (mine) {
          setRating(mine.rating);
          setComment(mine.comment ?? '');
        }
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function reloadReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('room_id', id)
      .order('created_at', { ascending: false });
    const all = data ?? [];
    setReviews(all);
    if (userId) {
      const mine = all.find(r => r.user_id === userId) ?? null;
      setMyReview(mine);
    }
  }

  async function submitReview() {
    if (rating === 0) { Alert.alert('Выберите оценку', 'Нажмите на звёздочки, чтобы поставить оценку'); return; }

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
    Alert.alert('Удалить отзыв?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          await supabase.from('reviews').delete()
            .eq('room_id', id).eq('user_id', userId!);
          setMyReview(null);
          setRating(0);
          setComment('');
          setEditing(false);
          reloadReviews();
        },
      },
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
    const lat = room.latitude;
    const lon = room.longitude;
    const scheme = lat && lon
      ? `yandexmaps://maps.yandex.ru/?rtext=~${lat},${lon}&rtt=auto`
      : `yandexmaps://maps.yandex.ru/?text=${encodeURIComponent(room.address)}`;
    const web = lat && lon
      ? `https://maps.yandex.ru/?rtext=~${lat},${lon}&rtt=auto`
      : `https://maps.yandex.ru/?text=${encodeURIComponent(room.address)}`;
    const canOpen = await Linking.canOpenURL(scheme);
    Linking.openURL(canOpen ? scheme : web);
  }

  async function launchGoogle() {
    setMapPickerVisible(false);
    if (!room) return;
    const lat = room.latitude;
    const lon = room.longitude;
    const query = lat && lon ? `${lat},${lon}` : encodeURIComponent(room.address);
    const scheme = `comgooglemaps://?daddr=${query}&directionsmode=driving`;
    const web = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    const canOpen = await Linking.canOpenURL(scheme);
    Linking.openURL(canOpen ? scheme : web);
  }

  if (loading || !room) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const otherReviews = reviews.filter(r => r.user_id !== userId);
  const showForm = !myReview || editing;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Фотогалерея */}
        <View>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
          >
            {(room.photos.length > 0
              ? room.photos
              : ['https://placehold.co/400x270/FFE0ED/FF6B9D?text=KidRoom']
            ).map((uri, i) => (
              <Image key={i} source={{ uri }} style={[styles.photo, { width: W }]} resizeMode="cover" />
            ))}
          </ScrollView>
          {room.photos.length > 1 && (
            <View style={styles.dots}>
              {room.photos.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Заголовок */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{room.name}</Text>
            <View style={styles.titleActions}>
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color={C.star} />
                <Text style={styles.ratingText}>{room.rating.toFixed(1)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(room.id)}
                hitSlop={8}
                activeOpacity={0.7}
              >
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

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Цена за команду</Text>
            <Text style={styles.price}>{(room.price_per_team ?? room.price_per_hour).toLocaleString('ru-RU')} ₽</Text>
          </View>

          {/* Характеристики квеста */}
          {(room.genre || room.difficulty || room.age_limit || room.duration_minutes) && (
            <View style={styles.questGrid}>
              {room.genre && (
                <View style={styles.questItem}>
                  <Text style={styles.questItemLabel}>Жанр</Text>
                  <Text style={styles.questItemValue}>{room.genre}</Text>
                </View>
              )}
              {room.difficulty && (
                <View style={styles.questItem}>
                  <Text style={styles.questItemLabel}>Сложность</Text>
                  <Text style={styles.questItemValue}>{room.difficulty}</Text>
                </View>
              )}
              {room.age_limit && (
                <View style={styles.questItem}>
                  <Text style={styles.questItemLabel}>Возраст</Text>
                  <Text style={styles.questItemValue}>{room.age_limit}</Text>
                </View>
              )}
              {room.duration_minutes && (
                <View style={styles.questItem}>
                  <Text style={styles.questItemLabel}>Длительность</Text>
                  <Text style={styles.questItemValue}>{room.duration_minutes} мин</Text>
                </View>
              )}
              {room.min_players && room.max_players && (
                <View style={styles.questItem}>
                  <Text style={styles.questItemLabel}>Игроки</Text>
                  <Text style={styles.questItemValue}>{room.min_players}–{room.max_players} чел</Text>
                </View>
              )}
              {room.has_actor != null && (
                <View style={styles.questItem}>
                  <Text style={styles.questItemLabel}>Актёр</Text>
                  <Text style={styles.questItemValue}>{room.has_actor ? '🎭 Да' : 'Нет'}</Text>
                </View>
              )}
              {room.is_scary && (
                <View style={styles.questItem}>
                  <Text style={styles.questItemLabel}>Страшность</Text>
                  <Text style={styles.questItemValue}>
                    {room.is_scary === 'нет' ? '😊 Нет' : room.is_scary === 'немного' ? '😨 Немного' : '💀 Хоррор'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.description}>{room.description}</Text>

          {/* ── Раздел отзывов ── */}
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

          {/* Блок "оставить/ваш отзыв" */}
          {!userId || isGuest ? (
            <View style={styles.authHint}>
              <Ionicons name="person-circle-outline" size={20} color={C.textLight} />
              <Text style={styles.authHintText}>Войдите в аккаунт, чтобы оставить отзыв</Text>
            </View>
          ) : myReview && !editing ? (
            /* Карточка существующего отзыва пользователя */
            <View style={styles.myReviewCard}>
              <View style={styles.myReviewTop}>
                <Text style={styles.myReviewLabel}>Ваш отзыв</Text>
                <View style={styles.myReviewActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => { setEditing(true); }}
                    hitSlop={8}
                  >
                    <Ionicons name="pencil-outline" size={15} color={C.primary} />
                    <Text style={[styles.editBtnText, { color: C.primary }]}>Изменить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={deleteReview} hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color={C.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <StarRating value={myReview.rating} size={20} />
              {myReview.comment ? (
                <Text style={styles.myReviewComment}>{myReview.comment}</Text>
              ) : null}
              <Text style={styles.reviewDate}>
                {new Date(myReview.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          ) : (
            /* Форма отзыва */
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {myReview ? 'Редактировать отзыв' : 'Оставить отзыв'}
              </Text>

              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Ваша оценка</Text>
                <StarRating value={rating} size={32} onSelect={setRating} />
              </View>
              {rating > 0 && (
                <Text style={styles.ratingCaption}>{RATING_CAPTIONS[rating]}</Text>
              )}

              <TextInput
                style={styles.commentInput}
                placeholder="Комментарий (необязательно)"
                placeholderTextColor={C.textLight}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />

              <View style={styles.formActions}>
                {editing && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => { setEditing(false); setRating(myReview!.rating); setComment(myReview!.comment ?? ''); }}
                  >
                    <Text style={[styles.cancelBtnText, { color: C.textLight }]}>Отмена</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: rating === 0 ? C.border : C.primary }, submitting && { opacity: 0.6 }]}
                  onPress={submitReview}
                  disabled={submitting || rating === 0}
                  activeOpacity={0.85}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitBtnText}>
                        {myReview ? 'Сохранить' : 'Отправить отзыв'}
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Остальные отзывы */}
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
                    <Text style={styles.reviewAvatarText}>
                      {(r.users?.name || 'Г')[0].toUpperCase()}
                    </Text>
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
        </View>

        {/* Кнопка бронирования */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push({ pathname: '/booking/[roomId]', params: { roomId: room.id, roomName: room.name } })}
          >
            <Text style={styles.bookBtnText}>
              Забронировать — {(room.price_per_team ?? room.price_per_hour).toLocaleString('ru-RU')} ₽
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Выбор навигатора */}
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

const RATING_CAPTIONS: Record<number, string> = {
  1: 'Ужасно 😞',
  2: 'Плохо 😕',
  3: 'Нормально 😐',
  4: 'Хорошо 😊',
  5: 'Отлично! 🎉',
};

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },

    photo: { height: 270 },
    dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: '#FFFFFF', width: 22 },

    content: { padding: 20, gap: 14 },

    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontSize: 22, fontWeight: '800', color: C.text, flex: 1, marginRight: 8 },
    titleActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#9A7000' },

    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 14, color: C.textLight, flex: 1 },
    infoTextLink: { color: C.primary, textDecorationLine: 'underline' },

    priceBox: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontSize: 14, color: C.primary, fontWeight: '600' },
    price: { fontSize: 24, fontWeight: '800', color: C.primary },

    description: { fontSize: 15, color: C.text, lineHeight: 23 },

    questGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    questItem: {
      backgroundColor: C.white, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: C.border,
      minWidth: '46%', flex: 1,
    },
    questItemLabel: { fontSize: 11, color: C.textLight, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase' },
    questItemValue: { fontSize: 15, color: C.text, fontWeight: '700' },

    // Раздел отзывов
    reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    avgBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF9E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    avgText: { fontSize: 13, fontWeight: '700', color: '#9A7000' },

    // Подсказка для гостей
    authHint: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
    authHintText: { fontSize: 14, color: C.textLight },

    // Карточка своего отзыва
    myReviewCard: { backgroundColor: C.primaryLight, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1.5, borderColor: C.primary },
    myReviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    myReviewLabel: { fontSize: 13, fontWeight: '700', color: C.primary },
    myReviewActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    editBtnText: { fontSize: 13, fontWeight: '600' },
    myReviewComment: { fontSize: 14, color: C.text, lineHeight: 20 },

    // Форма отзыва
    formCard: { backgroundColor: C.white, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1.5, borderColor: C.border },
    formTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ratingLabel: { fontSize: 14, color: C.text, fontWeight: '500' },
    ratingCaption: { fontSize: 13, color: C.textLight, marginTop: -6 },
    commentInput: {
      backgroundColor: C.background,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: C.border,
      padding: 12,
      fontSize: 14,
      color: C.text,
      minHeight: 80,
    },
    formActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    cancelBtn: { paddingVertical: 12, paddingHorizontal: 4 },
    cancelBtnText: { fontSize: 14, fontWeight: '600' },
    submitBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Список отзывов
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

    footer: { padding: 20, paddingTop: 0 },
    bookBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 18, alignItems: 'center' },
    bookBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

    // Диалог выбора навигатора
    pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    pickerDialog: {
      position: 'absolute', bottom: 32, left: 20, right: 20,
      backgroundColor: C.white, borderRadius: 18, overflow: 'hidden',
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
    },
    pickerTitle: { fontSize: 13, fontWeight: '600', color: C.textLight, textAlign: 'center', paddingTop: 16, paddingBottom: 8 },
    pickerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
    pickerIcon: { width: 24, height: 24, borderRadius: 6 },
    pickerLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: C.text },
    pickerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 20 },
    pickerCancel: { padding: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, marginTop: 4 },
    pickerCancelText: { fontSize: 15, fontWeight: '600' },
  });
}
