import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  type BirthInput,
  type CountryOption,
  type Gender,
  type WorldCity,
  formatBirthPlace,
  resolveBirthPlace,
  searchCitiesInCountry,
  searchCountries,
  worldCityToBirthFields,
} from '@asto/shared';
import { Button, Card, Chip, ErrorText, Field, SectionTitle } from '@/components/ui';
import { type CitySelection, resolveBirthLocation } from '@/lib/birthLocation';
import { colors, fonts, spacing, typography } from '@/constants/theme';

type Props = {
  initial?: Partial<BirthInput>;
  submitLabel: string;
  onSubmit: (birth: BirthInput) => Promise<void>;
  variant?: 'default' | 'partner';
  embedded?: boolean;
  compact?: boolean;
  onCancel?: () => void;
};

/** Calendar date as local noon — avoids UTC / DST off-by-one in native pickers. */
function parseBirthDateString(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
  }
  return new Date(1995, 5, 15, 12, 0, 0, 0);
}

function formatBirthDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidBirthDate(dateStr: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function parseBirthTimeString(timeStr: string): Date {
  const match = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
      return date;
    }
  }
  return new Date(2000, 0, 1, 12, 0, 0, 0);
}

function formatBirthTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isValidBirthTime(timeStr: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(timeStr);
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function BirthForm({
  initial,
  submitLabel,
  onSubmit,
  variant = 'default',
  embedded = false,
  compact = false,
  onCancel,
}: Props) {
  const isPartner = variant === 'partner';
  const resolved = useMemo(() => resolveBirthPlace(initial), [initial]);
  const defaultCountry = resolved ?? {
    countryCode: 'TR',
    countryName: 'Türkiye',
    cityName: '',
    location: null,
  };

  const [name, setName] = useState(initial?.name ?? '');
  const [birthDate, setBirthDate] = useState(
    initial?.birthDate ?? (isPartner ? '' : '1995-06-15'),
  );
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? '12:00');
  const [countryQuery, setCountryQuery] = useState(defaultCountry.countryName);
  const [countryCode, setCountryCode] = useState(defaultCountry.countryCode);
  const [countryName, setCountryName] = useState(defaultCountry.countryName);
  const [cityQuery, setCityQuery] = useState(defaultCountry.cityName);
  const [selectedCity, setSelectedCity] = useState<CitySelection | null>(
    defaultCountry.location,
  );
  const [gender, setGender] = useState<Gender | undefined>(initial?.gender);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => parseBirthDateString('1995-06-15'));
  const [pickerTime, setPickerTime] = useState(() => parseBirthTimeString('12:00'));
  const [showCountryList, setShowCountryList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);

  const closePickers = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const openDatePicker = () => {
    Keyboard.dismiss();
    closePickers();
    setShowCountryList(false);
    setShowCityList(false);
    setPickerDate(parseBirthDateString(birthDate));
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    Keyboard.dismiss();
    closePickers();
    setShowCountryList(false);
    setShowCityList(false);
    setPickerTime(parseBirthTimeString(birthTime));
    setShowTimePicker(true);
  };

  const countrySuggestions = useMemo(() => {
    if (!showCountryList) return [];
    return searchCountries(countryQuery, 20);
  }, [countryQuery, showCountryList]);

  const citySuggestions = useMemo(() => {
    if (!showCityList || !countryCode) return [];
    return searchCitiesInCountry(countryCode, cityQuery, 20);
  }, [countryCode, cityQuery, showCityList]);

  const pickCountry = (item: CountryOption) => {
    setCountryCode(item.code);
    setCountryName(item.name);
    setCountryQuery(item.name);
    setCityQuery('');
    setSelectedCity(null);
    setShowCountryList(false);
    setShowCityList(true);
  };

  const pickCity = (item: WorldCity) => {
    const fields = worldCityToBirthFields(item);
    setCityQuery(fields.city);
    setSelectedCity(fields);
    setCountryCode(item.country);
    setCountryName(item.countryName);
    setCountryQuery(item.countryName);
    setShowCityList(false);
  };

  const onCountryChange = (text: string) => {
    setCountryQuery(text);
    setCountryCode('');
    setCountryName('');
    setCityQuery('');
    setSelectedCity(null);
    setShowCountryList(true);
    setShowCityList(false);
  };

  const onCityChange = (text: string) => {
    setCityQuery(text);
    setSelectedCity(null);
    setShowCityList(true);
  };

  const onDatePicked = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    setBirthDate(formatBirthDate(selected));
  };

  const onTimePicked = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    setBirthTime(formatBirthTime(selected));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('İsim gerekli');
      return;
    }
    if (!gender && isPartner) {
      setError('Sinastri yorumu için cinsiyet seçin');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError('Tarih YYYY-AA-GG formatında olmalı');
      return;
    }
    if (!isValidBirthDate(birthDate)) {
      setError('Geçerli bir doğum tarihi girin');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(birthTime)) {
      setError('Saat SS:DD formatında olmalı');
      return;
    }
    if (!isValidBirthTime(birthTime)) {
      setError('Geçerli bir doğum saati girin');
      return;
    }

    const location = resolveBirthLocation(countryCode, cityQuery, {
      selected: selectedCity ?? undefined,
      initial,
    });
    if ('error' in location) {
      setError(location.error);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        birthDate,
        birthTime,
        city: location.city,
        country: location.country,
        countryName: location.countryName,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        gender,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      {!embedded ? (
        <SectionTitle compact={compact}>
          {isPartner ? 'Partner bilgileri' : 'Kişisel bilgiler'}
        </SectionTitle>
      ) : null}

      {isPartner ? (
        <Text style={styles.partnerHint}>
          Doğum tarihi ve saati ne kadar doğruysa sinastri yorumu o kadar isabetli olur.
        </Text>
      ) : null}

      <Field
        compact={compact}
        label={isPartner ? 'Partnerin adı' : 'Ad'}
        value={name}
        onChangeText={setName}
        placeholder={isPartner ? 'Örn. Ayşe' : 'Adınız'}
      />

      <Text style={[typography.label, compact && styles.labelCompact]}>
        Cinsiyet{isPartner ? ' (zorunlu)' : ' (ilişki yorumu için)'}
      </Text>
      <View style={styles.genderRow}>
        <Chip
          compact
          label="Kadın"
          active={gender === 'female'}
          onPress={() => setGender('female')}
        />
        <Chip compact label="Erkek" active={gender === 'male'} onPress={() => setGender('male')} />
      </View>

      <View style={styles.rowFields}>
        <View style={styles.half}>
          <Pressable onPress={openDatePicker}>
            <View pointerEvents="none">
              <Field
                compact={compact}
                label="Doğum tarihi"
                value={birthDate}
                editable={false}
                placeholder="1995-06-15"
              />
            </View>
          </Pressable>
        </View>
        <View style={styles.half}>
          <Pressable onPress={openTimePicker}>
            <View pointerEvents="none">
              <Field
                compact={compact}
                label="Doğum saati"
                value={birthTime}
                editable={false}
                placeholder="14:30"
              />
            </View>
          </Pressable>
        </View>
      </View>

      {Platform.OS === 'android' && showDatePicker ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={onDatePicked}
          maximumDate={new Date()}
        />
      ) : null}
      {Platform.OS === 'android' && showTimePicker ? (
        <DateTimePicker
          value={pickerTime}
          mode="time"
          display="default"
          onChange={onTimePicked}
          is24Hour
        />
      ) : null}
      {Platform.OS === 'ios' ? (
        <>
          <PickerModal
            visible={showDatePicker}
            title="Doğum tarihi"
            onClose={() => setShowDatePicker(false)}
            onConfirm={() => {
              setBirthDate(formatBirthDate(pickerDate));
              setShowDatePicker(false);
            }}
          >
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              onChange={(_, selected) => {
                if (selected) setPickerDate(selected);
              }}
              maximumDate={new Date()}
              locale="tr-TR"
              style={styles.pickerSpinner}
            />
          </PickerModal>
          <PickerModal
            visible={showTimePicker}
            title="Doğum saati"
            onClose={() => setShowTimePicker(false)}
            onConfirm={() => {
              setBirthTime(formatBirthTime(pickerTime));
              setShowTimePicker(false);
            }}
          >
            <DateTimePicker
              value={pickerTime}
              mode="time"
              display="spinner"
              onChange={(_, selected) => {
                if (selected) setPickerTime(selected);
              }}
              is24Hour
              locale="tr-TR"
              style={styles.pickerSpinner}
            />
          </PickerModal>
        </>
      ) : null}

      <Field
        compact={compact}
        label="Ülke"
        value={countryQuery}
        onChangeText={onCountryChange}
        onFocus={() => {
          closePickers();
          setShowCityList(false);
          setShowCountryList(true);
        }}
        placeholder="Ülke ara…"
        autoCapitalize="words"
      />
      {showCountryList && countrySuggestions.length > 0 ? (
        <SuggestionList
          items={countrySuggestions.map((c) => ({
            key: c.code,
            title: c.name,
            meta: `${c.cityCount.toLocaleString('tr-TR')} şehir`,
            onPress: () => pickCountry(c),
          }))}
          onClose={() => setShowCountryList(false)}
        />
      ) : null}

      <Field
        compact={compact}
        label="Şehir"
        value={cityQuery}
        onChangeText={onCityChange}
        onFocus={() => {
          closePickers();
          setShowCountryList(false);
          if (!countryCode) {
            setShowCountryList(true);
            return;
          }
          setShowCityList(true);
        }}
        placeholder={countryCode ? 'Şehir ara…' : 'Önce ülke seçin'}
        autoCapitalize="words"
      />
      {showCityList && citySuggestions.length > 0 ? (
        <SuggestionList
          items={citySuggestions.map((c) => ({
            key: `${c.country}-${c.name}`,
            title: c.name,
            meta: `${c.latitude.toFixed(2)}°, ${c.longitude.toFixed(2)}° · ${c.timezone.replace('_', ' ')}`,
            onPress: () => pickCity(c),
          }))}
          onClose={() => setShowCityList(false)}
        />
      ) : null}

      {selectedCity ? (
        <Text style={styles.selectedPlace}>
          Seçili: {formatBirthPlace(selectedCity)} ({selectedCity.latitude.toFixed(2)}°,{' '}
          {selectedCity.longitude.toFixed(2)}°)
        </Text>
      ) : null}

      <ErrorText>{error}</ErrorText>

      <View style={onCancel ? styles.actions : undefined}>
        {onCancel ? (
          <Button compact label="Vazgeç" variant="ghost" onPress={onCancel} />
        ) : null}
        <Button
          compact={compact}
          label={submitLabel}
          onPress={handleSubmit}
          loading={loading}
          icon={isPartner ? '◎' : '✦'}
        />
      </View>
    </>
  );

  if (embedded) return <View style={styles.embedded}>{content}</View>;
  return <Card style={styles.wrap}>{content}</Card>;
}

function PickerModal({
  visible,
  title,
  onClose,
  onConfirm,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerBackdrop} onPress={onClose}>
        <Pressable style={styles.pickerCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.pickerTitle}>{title}</Text>
          {children}
          <Button compact label="Tamam" onPress={onConfirm} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SuggestionList({
  items,
  onClose,
}: {
  items: Array<{ key: string; title: string; meta: string; onPress: () => void }>;
  onClose?: () => void;
}) {
  return (
    <View style={styles.suggestions}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={styles.suggestionsScroll}
      >
        {items.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionPressed]}
          >
            <Text style={styles.suggestionTitle}>{item.title}</Text>
            <Text style={styles.suggestionMeta}>{item.meta}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {onClose ? (
        <Pressable onPress={onClose} style={styles.suggestionClose}>
          <Text style={styles.suggestionCloseText}>Kapat</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 0 },
  embedded: { paddingBottom: spacing.sm },
  partnerHint: {
    ...typography.bodyMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  labelCompact: { fontSize: 11 },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  rowFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  half: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 140,
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.md,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pickerTitle: {
    ...typography.label,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  pickerSpinner: {
    height: 200,
  },
  suggestions: {
    marginTop: -4,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    maxHeight: 240,
    overflow: 'hidden',
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionClose: {
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  suggestionCloseText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.teal,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionPressed: {
    backgroundColor: colors.tealDim,
  },
  suggestionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  suggestionMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  selectedPlace: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.teal,
    marginBottom: spacing.sm,
  },
  actions: {
    gap: 6,
  },
});
