import type { Request, Response, NextFunction } from 'express';
import type { Profile } from '@asto/shared';
import { store } from './store';

export interface AuthedRequest extends Request {
  user?: Profile;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const user = store.userFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'Oturum gerekli' });
    return;
  }
  req.user = user;
  next();
}
