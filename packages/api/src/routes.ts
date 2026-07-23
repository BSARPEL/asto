/**
 * HTTP routes for @asto/api.
 *
 * - `ai-routes.ts` — Gemini endpoints (mobile `lib/ai-api.ts` via EXPO_PUBLIC_AI_API_URL)
 * - `legacy-routes.ts` — auth, profile, partners CRUD, tokens (local JSON / dev only)
 */
import { Router } from 'express';
import { registerAiRoutes } from './routes/ai-routes';
import { registerLegacyRoutes } from './routes/legacy-routes';

export const router = Router();

registerAiRoutes(router);
registerLegacyRoutes(router);
