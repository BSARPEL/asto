import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BirthInput, Partner, RelationshipType } from '@asto/shared';

const DRAFT_KEY = 'asto_analysis_draft';
const SELECTED_PARTNER_KEY = 'asto_selected_partner_id';

/** Plus, explicit unlock, or legacy analyses (pre-funnel) count as unlocked. */
export function isPartnerReportUnlocked(
  partner: Pick<Partner, 'analysis' | 'fullUnlocked'> | null | undefined,
  isSubscribed?: boolean,
): boolean {
  if (!partner?.analysis) return false;
  if (isSubscribed || partner.fullUnlocked) return true;
  if (partner.fullUnlocked === false) return false;
  return true;
}

export type AnalysisDraft = {
  relationshipType?: RelationshipType;
  personA?: BirthInput;
  personB?: BirthInput;
  focus?: string;
  partnerId?: string;
};

export async function loadAnalysisDraft(): Promise<AnalysisDraft> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AnalysisDraft;
  } catch {
    return {};
  }
}

export async function saveAnalysisDraft(patch: Partial<AnalysisDraft>): Promise<AnalysisDraft> {
  const prev = await loadAnalysisDraft();
  const next = { ...prev, ...patch };
  // Explicit undefined clears keys (e.g. partnerId on new funnel start).
  for (const key of Object.keys(patch) as (keyof AnalysisDraft)[]) {
    if (patch[key] === undefined) delete next[key];
  }
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  return next;
}

export async function clearAnalysisDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}

export async function getSelectedPartnerId(): Promise<string | null> {
  return AsyncStorage.getItem(SELECTED_PARTNER_KEY);
}

export async function setSelectedPartnerId(id: string | null): Promise<void> {
  if (!id) await AsyncStorage.removeItem(SELECTED_PARTNER_KEY);
  else await AsyncStorage.setItem(SELECTED_PARTNER_KEY, id);
}
