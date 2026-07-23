import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, ROUNDS);
}

export function verifyPasswordSync(password: string, passwordHash: string): boolean {
  return bcrypt.compareSync(password, passwordHash);
}
