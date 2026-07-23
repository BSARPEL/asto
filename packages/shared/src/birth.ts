import type { BirthInput } from './types';
import { findCityInCountry, getCountry, resolveBirthPlace } from './cities';
import { stripUndefinedDeep } from './firestore-util';

/** Ensure country fields and coordinates from country+city when possible. */
export function normalizeBirthInput(birth: BirthInput): BirthInput {
  let normalized: BirthInput;

  if (birth.country && birth.countryName && birth.city && birth.latitude != null) {
    const found = findCityInCountry(birth.country, birth.city);
    if (found) {
      normalized = {
        ...birth,
        city: found.name,
        country: found.country,
        countryName: found.countryName,
        latitude: found.latitude,
        longitude: found.longitude,
        timezone: found.timezone,
      };
    } else {
      normalized = birth;
    }
  } else {
    const resolved = resolveBirthPlace(birth);
    if (resolved?.location) {
      normalized = { ...birth, ...resolved.location };
    } else if (birth.country && !birth.countryName) {
      const c = getCountry(birth.country);
      normalized = c ? { ...birth, countryName: c.name } : birth;
    } else {
      normalized = birth;
    }
  }

  return stripUndefinedDeep(normalized);
}
