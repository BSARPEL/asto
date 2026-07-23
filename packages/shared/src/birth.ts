import type { BirthInput } from './types';
import { findCityInCountry, getCountry, resolveBirthPlace } from './cities';

/** Ensure country fields and coordinates from country+city when possible. */
export function normalizeBirthInput(birth: BirthInput): BirthInput {
  if (birth.country && birth.countryName && birth.city && birth.latitude != null) {
    const found = findCityInCountry(birth.country, birth.city);
    if (found) {
      return {
        ...birth,
        city: found.name,
        country: found.country,
        countryName: found.countryName,
        latitude: found.latitude,
        longitude: found.longitude,
        timezone: found.timezone,
      };
    }
    return birth;
  }

  const resolved = resolveBirthPlace(birth);
  if (resolved?.location) {
    return { ...birth, ...resolved.location };
  }

  if (birth.country && !birth.countryName) {
    const c = getCountry(birth.country);
    if (c) return { ...birth, countryName: c.name };
  }

  return birth;
}
