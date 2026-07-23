import { computeNatalChart, normalizeBirthInput, type BirthInput, type Profile } from '@asto/shared';
import { firebaseSaveProfile } from './firebase-profile';

/**
 * Natal harita oluşturma — yalnızca cihazda hesap + Firebase Firestore.
 * AI veya REST API kullanılmaz (bkz. lib/ai-api.ts).
 */
export async function saveUserBirth(
  userId: string,
  birthInput: BirthInput,
  currentDisplayName?: string,
): Promise<Profile> {
  const birth = normalizeBirthInput(birthInput);
  if (!birth?.birthDate || !birth?.birthTime || birth.latitude == null || birth.longitude == null) {
    throw new Error('Doğum bilgileri eksik');
  }
  if (!birth.country || !birth.countryName || !birth.city) {
    throw new Error('Ülke ve şehir gerekli');
  }

  const natalChart = computeNatalChart(birth);
  return firebaseSaveProfile(userId, {
    birth,
    natalChart,
    displayName: birth.name || currentDisplayName || 'Kullanıcı',
  });
}
