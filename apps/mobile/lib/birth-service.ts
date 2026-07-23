import { normalizeBirthInput, computeNatalChart, type BirthInput } from '@asto/shared';
import { firebaseSaveProfile } from './firebase-profile';

export async function saveBirthProfile(
  userId: string,
  displayName: string,
  raw: BirthInput,
) {
  const birth = normalizeBirthInput(raw);
  if (!birth?.birthDate || !birth?.birthTime || birth.latitude == null || birth.longitude == null) {
    throw new Error('Doğum bilgileri eksik');
  }
  if (!birth.country || !birth.countryName || !birth.city) {
    throw new Error('Ülke ve şehir gerekli');
  }

  const natalChart = computeNatalChart(birth);
  const profile = await firebaseSaveProfile(userId, {
    birth,
    natalChart,
    displayName: birth.name || displayName,
  });
  return profile;
}
