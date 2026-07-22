import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CITY_PRESETS, type BirthInput } from '@asto/shared';
import { Button, Chip, ErrorText, Field } from '@/components/ui';
import { spacing } from '@/constants/theme';

type Props = {
  initial?: Partial<BirthInput>;
  submitLabel: string;
  onSubmit: (birth: BirthInput) => Promise<void>;
};

export function BirthForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '1995-06-15');
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? '12:00');
  const [city, setCity] = useState(initial?.city ?? 'İstanbul');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = useMemo(
    () => CITY_PRESETS.find((c) => c.city === city) ?? CITY_PRESETS[0],
    [city],
  );

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('İsim gerekli');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError('Tarih YYYY-AA-GG formatında olmalı');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(birthTime)) {
      setError('Saat SS:DD formatında olmalı');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        birthDate,
        birthTime,
        city: preset.city,
        latitude: preset.latitude,
        longitude: preset.longitude,
        timezone: preset.timezone,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Field label="Ad" value={name} onChangeText={setName} placeholder="Adınız" />
      <Field
        label="Doğum tarihi (YYYY-AA-GG)"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="1995-06-15"
        autoCapitalize="none"
      />
      <Field
        label="Doğum saati (SS:DD)"
        value={birthTime}
        onChangeText={setBirthTime}
        placeholder="14:30"
        autoCapitalize="none"
      />
      <Field label="Şehir" value={city} onChangeText={setCity} placeholder="İstanbul" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {CITY_PRESETS.map((c) => (
          <Chip
            key={c.city}
            label={c.city}
            active={city === c.city}
            onPress={() => setCity(c.city)}
          />
        ))}
      </ScrollView>
      <ErrorText>{error}</ErrorText>
      <Button label={submitLabel} onPress={handleSubmit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { marginBottom: spacing.md, maxHeight: 48 },
});
