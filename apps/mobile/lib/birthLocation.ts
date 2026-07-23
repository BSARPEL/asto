import type { BirthInput, WorldCity } from '@asto/shared';
import {
  findCityInCountry,
  formatBirthPlace,
  worldCityToBirthFields,
} from '@asto/shared';

export type CitySelection = Pick<
  BirthInput,
  'city' | 'country' | 'countryName' | 'latitude' | 'longitude' | 'timezone'
>;

export function resolveBirthLocation(
  countryCode: string,
  cityName: string,
  options?: {
    selected?: CitySelection;
    initial?: Partial<BirthInput>;
  },
): CitySelection | { error: string } {
  if (options?.selected) {
    return options.selected;
  }

  const city = cityName.trim();
  if (!countryCode) return { error: 'Ülke seçin' };
  if (!city) return { error: 'Şehir seçin' };

  const match = findCityInCountry(countryCode, city);
  if (match) {
    return worldCityToBirthFields(match);
  }

  const initial = options?.initial;
  if (
    initial?.country === countryCode &&
    initial.city?.trim().toLocaleLowerCase('tr') === city.toLocaleLowerCase('tr') &&
    initial.latitude != null &&
    initial.longitude != null
  ) {
    return {
      city: initial.city,
      country: initial.country,
      countryName: initial.countryName ?? countryCode,
      latitude: initial.latitude,
      longitude: initial.longitude,
      timezone: initial.timezone ?? 'UTC',
    };
  }

  return { error: 'Bu ülkede şehir bulunamadı. Listeden bir öneri seçin.' };
}

export { formatBirthPlace, worldCityToBirthFields };
export type { WorldCity };
