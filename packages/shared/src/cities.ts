import worldData from './data/world-cities.json';
import type { BirthInput } from './types';

/** Per-country city row: name, lat, lng, timezone, population */
type CityRow = [string, number, number, string, number];

export interface WorldCity {
  name: string;
  country: string;
  countryName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  population: number;
}

export interface CountryOption {
  code: string;
  name: string;
  cityCount: number;
}

const data = worldData as unknown as {
  count: number;
  countries: Record<string, { name: string; cities: CityRow[] }>;
};

let countryListCache: CountryOption[] | null = null;

function foldKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[ıİiI]/g, 'i')
    .replace(/\s+/g, ' ');
}

function rowToCity(countryCode: string, countryName: string, row: CityRow): WorldCity {
  const [name, lat, lng, tz, pop] = row;
  return {
    name,
    country: countryCode,
    countryName,
    latitude: lat,
    longitude: lng,
    timezone: tz,
    population: pop,
  };
}

export function worldCityCount(): number {
  return data.count;
}

export function listCountries(): CountryOption[] {
  if (countryListCache) return countryListCache;
  countryListCache = Object.entries(data.countries)
    .map(([code, meta]) => ({
      code,
      name: meta.name,
      cityCount: meta.cities.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  return countryListCache;
}

export function searchCountries(query: string, limit = 12): CountryOption[] {
  const q = foldKey(query);
  if (!q) return listCountries().slice(0, limit);

  const scored: Array<{ item: CountryOption; score: number }> = [];
  for (const item of listCountries()) {
    const nameKey = foldKey(item.name);
    const codeKey = foldKey(item.code);
    if (nameKey === q || codeKey === q) {
      scored.push({ item, score: 10_000 + item.cityCount });
      continue;
    }
    if (nameKey.startsWith(q)) {
      scored.push({ item, score: 1_000 + item.cityCount });
      continue;
    }
    if (nameKey.includes(q)) {
      scored.push({ item, score: 100 + item.cityCount });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

export function getCountry(code: string): CountryOption | null {
  const meta = data.countries[code];
  if (!meta) return null;
  return { code, name: meta.name, cityCount: meta.cities.length };
}

export function listCitiesInCountry(countryCode: string, limit = 50): WorldCity[] {
  const meta = data.countries[countryCode];
  if (!meta) return [];
  return meta.cities.slice(0, limit).map((row) => rowToCity(countryCode, meta.name, row));
}

export function searchCitiesInCountry(countryCode: string, query: string, limit = 12): WorldCity[] {
  const meta = data.countries[countryCode];
  if (!meta) return [];

  const q = foldKey(query);
  if (!q) return listCitiesInCountry(countryCode, limit);

  const scored: Array<{ city: WorldCity; score: number }> = [];
  for (const row of meta.cities) {
    const city = rowToCity(countryCode, meta.name, row);
    const nameKey = foldKey(city.name);
    if (nameKey === q) {
      scored.push({ city, score: 10_000_000 + city.population });
      continue;
    }
    if (nameKey.startsWith(q)) {
      scored.push({ city, score: 1_000_000 + city.population });
      continue;
    }
    if (nameKey.includes(q)) {
      scored.push({ city, score: 100_000 + city.population });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.city);
}

export function findCityInCountry(countryCode: string, cityName: string): WorldCity | null {
  const matches = searchCitiesInCountry(countryCode, cityName, 5);
  if (matches.length === 0) return null;
  const q = foldKey(cityName);
  const exact = matches.find((c) => foldKey(c.name) === q);
  return exact ?? (matches.length === 1 ? matches[0] : null);
}

/** Display: Ülke · Şehir */
export function formatBirthPlace(
  birth: Pick<BirthInput, 'city' | 'country' | 'countryName'>,
): string {
  if (birth.countryName && birth.city) {
    return `${birth.countryName} · ${birth.city}`;
  }
  return birth.city;
}

export function worldCityToBirthFields(city: WorldCity): Pick<
  BirthInput,
  'city' | 'country' | 'countryName' | 'latitude' | 'longitude' | 'timezone'
> {
  return {
    city: city.name,
    country: city.country,
    countryName: city.countryName,
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone,
  };
}

/** Resolve country/city from saved birth or legacy "City, Country" strings. */
export function resolveBirthPlace(initial?: Partial<BirthInput>): {
  countryCode: string;
  countryName: string;
  cityName: string;
  location: Pick<BirthInput, 'city' | 'country' | 'countryName' | 'latitude' | 'longitude' | 'timezone'> | null;
} | null {
  if (!initial?.city) return null;

  if (initial.country && initial.countryName) {
    const city =
      findCityInCountry(initial.country, initial.city) ??
      (initial.latitude != null && initial.longitude != null
        ? {
            name: initial.city,
            country: initial.country,
            countryName: initial.countryName,
            latitude: initial.latitude,
            longitude: initial.longitude,
            timezone: initial.timezone ?? 'UTC',
            population: 0,
          }
        : null);

    return {
      countryCode: initial.country,
      countryName: initial.countryName,
      cityName: initial.city,
      location: city ? worldCityToBirthFields(city) : null,
    };
  }

  const legacy = initial.city;
  const comma = legacy.lastIndexOf(',');
  if (comma > 0) {
    const cityPart = legacy.slice(0, comma).trim();
    const countryPart = legacy.slice(comma + 1).trim();
    for (const country of listCountries()) {
      if (foldKey(country.name) === foldKey(countryPart)) {
        const found = findCityInCountry(country.code, cityPart);
        if (found) {
          return {
            countryCode: country.code,
            countryName: country.name,
            cityName: found.name,
            location: worldCityToBirthFields(found),
          };
        }
      }
    }
  }

  for (const country of listCountries()) {
    const found = findCityInCountry(country.code, legacy);
    if (found) {
      return {
        countryCode: country.code,
        countryName: country.name,
        cityName: found.name,
        location: worldCityToBirthFields(found),
      };
    }
  }

  return {
    countryCode: initial.country ?? 'TR',
    countryName: initial.countryName ?? getCountry('TR')?.name ?? 'Türkiye',
    cityName: initial.city,
    location:
      initial.latitude != null && initial.longitude != null
        ? {
            city: initial.city,
            country: initial.country ?? 'TR',
            countryName: initial.countryName ?? 'Türkiye',
            latitude: initial.latitude,
            longitude: initial.longitude,
            timezone: initial.timezone ?? 'Europe/Istanbul',
          }
        : null,
  };
}
