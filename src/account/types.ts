import { z } from 'zod';

const count = z.number().int().nonnegative().safe();
const identifier = z.string().min(1).max(120);
export const ThemeSchema = z.enum(['signal', 'forest', 'night', 'track', 'alpine', 'dusk']);
export type AccountTheme = z.infer<typeof ThemeSchema>;
export const AccountPreferencesSchema = z.object({
  sprint_mps: z.number().finite().min(1.5).max(6.5),
  bag: z.boolean(), min_margin_s: z.number().int().min(45).max(300), offer_sprint_routes: z.boolean(),
});
export const AccountDataSchema = z.object({
  user: z.object({
    id: z.string().uuid(), name: z.string().max(240), email: z.string().email(),
    profile_picture_url: z.string().url().refine(value => /^https?:\/\//.test(value)).nullable(),
  }),
  profile: z.object({
    nickname: z.string().min(1).max(40), selected_theme: ThemeSchema, preferences: AccountPreferencesSchema,
  }),
  stats: z.object({
    points: count, practice_completed: count, practice_total: count, attempts: count, verified_attempts: count,
    active_days: count.default(0), current_month_days: count.default(0), last_active_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
    next_reward: z.object({ id: identifier, name: z.string().max(120), points_required: count, points_remaining: count }).nullable().default(null),
  }),
  badges: z.array(z.string().min(1).max(80)).max(100),
  rewards: z.array(z.object({ id: identifier, name: z.string().min(1).max(120), points_required: count, unlocked: z.boolean() })).max(100),
});
export type AccountData = z.infer<typeof AccountDataSchema>;
export const ProfileUpdateSchema = z.object({
  nickname: z.string().trim().min(1).max(40).optional(), selected_theme: ThemeSchema.optional(),
  preferences: AccountPreferencesSchema.partial().strict().optional(),
}).strict();
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export const PracticeScenarioSchema = z.object({
  id: identifier, title: z.string().min(1).max(200), prompt: z.string().min(1).max(2000),
  choices: z.array(z.object({ id: identifier, label: z.string().min(1).max(1000) })).min(2).max(12), completed: z.boolean(),
}).refine(value => new Set(value.choices.map(choice => choice.id)).size === value.choices.length, 'Repeated choice ID');
export type PracticeScenario = z.infer<typeof PracticeScenarioSchema>;
export const PracticeListSchema = z.object({
  scenarios: z.array(PracticeScenarioSchema).max(100),
}).refine(value => new Set(value.scenarios.map(scenario => scenario.id)).size === value.scenarios.length, 'Repeated scenario ID');
export const PracticeResultSchema = z.object({
  correct: z.boolean(), awarded_points: count, feedback: z.string().min(1).max(2000), account: AccountDataSchema,
});
export type PracticeResult = z.infer<typeof PracticeResultSchema>;
export const ActivityResultSchema = z.object({ awarded_points: z.union([z.literal(0), z.literal(5)]), recorded: z.boolean(), account: AccountDataSchema });
export type ActivityResult = z.infer<typeof ActivityResultSchema>;
export const AttemptInputSchema = z.object({
  client_id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/).optional(), route_id: z.string().max(120).optional(),
  platform: z.string().max(30).optional(), train: z.string().max(80).optional(),
  departure_at: z.string().datetime({ offset: true }).optional(), duration_s: z.number().finite().min(0).max(7200).optional(),
}).strict();
export type AttemptInput = z.infer<typeof AttemptInputSchema>;
export const AttemptSchema = z.object({
  id: z.string().uuid(), verification: z.literal('unverified'), points: z.literal(0),
  client_id: z.string().nullable().optional(), route_id: z.string().nullable().optional(), platform: z.string().nullable().optional(),
  train: z.string().nullable().optional(), departure_at: z.string().nullable().optional(), duration_s: z.number().finite().nullable().optional(),
  created_at: z.string().optional(),
});
export type AccountAttempt = z.infer<typeof AttemptSchema>;
export const AttemptListSchema = z.object({ attempts: z.array(AttemptSchema).max(100) });
export const AttemptResultSchema = z.object({ attempt: AttemptSchema, account: AccountDataSchema });
export type AttemptResult = z.infer<typeof AttemptResultSchema>;
export const DeleteResultSchema = z.object({ deleted: z.literal(true), website_account_preserved: z.literal(true) });
export const ExchangeResultSchema = AccountDataSchema.extend({ token: z.string().min(1).max(8192) });

export interface AccountState {
  status: 'guest' | 'loading' | 'signed-in' | 'error'; account?: AccountData; scenarios: PracticeScenario[]; attempts: AccountAttempt[]; error?: string;
}
export interface AccountClient {
  readonly state: AccountState;
  subscribe(listener: (state: AccountState) => void): () => void;
  load(): Promise<AccountState>;
  signIn(): Promise<void>;
  signOut(): void;
  saveProfile(update: ProfileUpdate): Promise<AccountData | undefined>;
  practice(scenarioId: string, answerId: string): Promise<PracticeResult | undefined>;
  recordAttempt(input: AttemptInput): Promise<AttemptResult | undefined>;
  recordActivity(kind: 'connection_checked'): Promise<ActivityResult | undefined>;
  deleteAccount(): Promise<boolean>;
}
export type AccountStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
