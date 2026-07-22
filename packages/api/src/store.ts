import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type {
  Conversation,
  DailyReading,
  Partner,
  Profile,
  TokenLedgerEntry,
} from '@asto/shared';
import { TOKEN_REWARDS } from '@asto/shared';

interface DbShape {
  users: Array<Profile & { password: string }>;
  partners: Partner[];
  conversations: Conversation[];
  readings: DailyReading[];
  ledger: TokenLedgerEntry[];
  adClaims: Array<{ userId: string; date: string; count: number }>;
  sessions: Array<{ token: string; userId: string; createdAt: string }>;
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function emptyDb(): DbShape {
  return {
    users: [],
    partners: [],
    conversations: [],
    readings: [],
    ledger: [],
    adClaims: [],
    sessions: [],
  };
}

function load(): DbShape {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
      const db = emptyDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      return db;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) as DbShape;
  } catch {
    return emptyDb();
  }
}

function save(db: DbShape) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = load();

export const store = {
  reload() {
    db = load();
  },

  createUser(email: string, password: string, displayName: string): Profile {
    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('Bu e-posta zaten kayıtlı');
    const now = new Date().toISOString();
    const user: Profile & { password: string } = {
      id: nanoid(),
      email: email.toLowerCase(),
      password,
      displayName,
      tokenBalance: TOKEN_REWARDS.signupBonus,
      isSubscribed: false,
      createdAt: now,
    };
    db.users.push(user);
    db.ledger.push({
      id: nanoid(),
      userId: user.id,
      delta: TOKEN_REWARDS.signupBonus,
      reason: 'signup_bonus',
      createdAt: now,
    });
    save(db);
    return strip(user);
  },

  authenticate(email: string, password: string): { profile: Profile; token: string } {
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) throw new Error('E-posta veya şifre hatalı');
    const token = nanoid(32);
    db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
    save(db);
    return { profile: strip(user), token };
  },

  userFromToken(token?: string | null): Profile | null {
    if (!token) return null;
    const session = db.sessions.find((s) => s.token === token);
    if (!session) return null;
    const user = db.users.find((u) => u.id === session.userId);
    return user ? strip(user) : null;
  },

  getUser(id: string): (Profile & { password: string }) | null {
    return db.users.find((u) => u.id === id) ?? null;
  },

  updateUser(id: string, patch: Partial<Profile>): Profile {
    const user = db.users.find((u) => u.id === id);
    if (!user) throw new Error('Kullanıcı bulunamadı');
    Object.assign(user, patch);
    save(db);
    return strip(user);
  },

  adjustTokens(userId: string, delta: number, reason: string): Profile {
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('Kullanıcı bulunamadı');
    if (user.tokenBalance + delta < 0) throw new Error('Yetersiz jeton');
    user.tokenBalance += delta;
    db.ledger.push({
      id: nanoid(),
      userId,
      delta,
      reason,
      createdAt: new Date().toISOString(),
    });
    save(db);
    return strip(user);
  },

  getLedger(userId: string): TokenLedgerEntry[] {
    return db.ledger.filter((e) => e.userId === userId).slice(-50).reverse();
  },

  getReading(userId: string, date: string): DailyReading | null {
    return db.readings.find((r) => r.userId === userId && r.date === date) ?? null;
  },

  saveReading(reading: DailyReading) {
    db.readings = db.readings.filter((r) => !(r.userId === reading.userId && r.date === reading.date));
    db.readings.push(reading);
    save(db);
  },

  listPartners(userId: string): Partner[] {
    return db.partners.filter((p) => p.userId === userId);
  },

  savePartner(partner: Partner) {
    db.partners.push(partner);
    save(db);
  },

  updatePartner(id: string, patch: Partial<Partner>): Partner {
    const p = db.partners.find((x) => x.id === id);
    if (!p) throw new Error('Partner bulunamadı');
    Object.assign(p, patch);
    save(db);
    return p;
  },

  getPartner(id: string, userId: string): Partner | null {
    return db.partners.find((p) => p.id === id && p.userId === userId) ?? null;
  },

  listConversations(userId: string): Conversation[] {
    return db.conversations
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getConversation(id: string, userId: string): Conversation | null {
    return db.conversations.find((c) => c.id === id && c.userId === userId) ?? null;
  },

  saveConversation(conv: Conversation) {
    const idx = db.conversations.findIndex((c) => c.id === conv.id);
    if (idx >= 0) db.conversations[idx] = conv;
    else db.conversations.push(conv);
    save(db);
  },

  claimAdReward(userId: string): { count: number; profile: Profile } {
    const date = new Date().toISOString().slice(0, 10);
    let row = db.adClaims.find((a) => a.userId === userId && a.date === date);
    if (!row) {
      row = { userId, date, count: 0 };
      db.adClaims.push(row);
    }
    if (row.count >= TOKEN_REWARDS.maxRewardedAdsPerDay) {
      throw new Error(`Günlük reklam limiti (${TOKEN_REWARDS.maxRewardedAdsPerDay}) doldu`);
    }
    row.count += 1;
    const profile = this.adjustTokens(userId, TOKEN_REWARDS.rewardedAd, 'rewarded_ad');
    return { count: row.count, profile };
  },

  getAdCount(userId: string): number {
    const date = new Date().toISOString().slice(0, 10);
    return db.adClaims.find((a) => a.userId === userId && a.date === date)?.count ?? 0;
  },
};

function strip(user: Profile & { password: string }): Profile {
  const { password: _, ...rest } = user;
  return rest;
}
