import { z } from 'zod';

const positive = z.number().finite().positive();
const nonnegative = z.number().finite().nonnegative();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().startsWith(value);
}, 'Invalid calendar date');

export const ValiditySchema = z.object({
  from: date.nullable(), to: date.nullable(), note: z.string().min(1),
}).refine(value => !value.from || !value.to || value.from <= value.to, 'Validity starts after it ends');
export type Validity = z.infer<typeof ValiditySchema>;

const coordinates = z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) });
const geofence = coordinates.extend({ r: positive });
const place = z.object({ id: z.string().min(1), name: z.string().min(1) });
const move = z.object({
  kind: z.enum(['street', 'hall', 'platform', 'ramp']), m: nonnegative,
  crossings: z.number().int().nonnegative().optional(), note: z.string().optional(),
});
const level = z.object({
  kind: z.enum(['stairs', 'escalator']), dir: z.enum(['up', 'down']), riseM: positive.max(25),
  steps: z.number().int().positive().optional(), note: z.string().optional(),
});
export const PathStepSchema = z.union([move, level]);
export type PathStep = z.infer<typeof PathStepSchema>;
const platforms = z.union([
  z.array(z.number().int().positive()).nonempty().refine(values => new Set(values).size === values.length, 'Repeated platform'),
  z.object({ from: z.number().int().positive(), to: z.number().int().positive() })
    .refine(value => value.from <= value.to, 'Reversed platform range'),
]);

export const RouteSchema = z.object({
  key: z.string().min(1), label: z.string().min(1), platforms,
  helps: z.enum(['strong', 'marginal', 'never']), confidence: z.enum(['high', 'medium', 'low']),
  validity: z.array(ValiditySchema).nonempty().optional(), landing: geofence.optional(),
  path: z.array(PathStepSchema).nonempty().refine(steps => steps.some(step => 'm' in step && step.m > 0), 'Route needs distance'),
  doorOffsetM: z.object({ typ: nonnegative, max: nonnegative })
    .refine(value => value.typ <= value.max, 'Typical door distance exceeds maximum'),
  note: z.string().min(1),
}).superRefine((route, ctx) => {
  const uncertain = [route.note, ...route.path.map(step => step.note ?? '')].some(note => note.includes('?'));
  if (uncertain && route.confidence === 'high') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confidence'], message: 'Unverified route notes require medium or low confidence' });
  }
});
export type Route = z.infer<typeof RouteSchema>;

export const HackSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\.[a-z0-9-]+$/), version: z.number().int().nonnegative(),
  kind: z.enum(['alight-early', 'transfer-slack']), status: z.enum(['draft', 'desk-verified', 'field-verified', 'disabled']),
  name: z.string().min(1), station: place.merge(coordinates).extend({ minTransferS: nonnegative }),
  alight: place.merge(coordinates).extend({
    lines: z.array(z.string()), platformLetters: z.record(z.string()), plannerWalkS: positive,
    geofence, note: z.string().optional(),
  }),
  rideOn: z.array(place.extend({
    lines: z.array(z.string()), rideS: nonnegative, plannerWalkS: positive,
    validity: z.array(ValiditySchema).nonempty().optional(), note: z.string().optional(),
  })),
  validity: z.array(ValiditySchema).nonempty(), fieldCheckNeeded: z.array(z.string()),
  instructions: z.string().min(1), routes: z.array(RouteSchema).nonempty(), sources: z.array(z.string().min(1)).nonempty(),
}).superRefine((hack, ctx) => {
  const keys = hack.routes.map(route => route.key);
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['routes'], message: 'Route keys must be unique' });
  const seen = new Set<number>();
  hack.routes.forEach((route, index) => {
    const values = Array.isArray(route.platforms) ? route.platforms
      : Array.from({ length: route.platforms.to - route.platforms.from + 1 }, (_, offset) => (route.platforms as { from: number }).from + offset);
    if (values.some(value => seen.has(value))) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['routes', index, 'platforms'], message: 'Platform groups overlap' });
    values.forEach(value => seen.add(value));
  });
});
export type Hack = z.infer<typeof HackSchema>;
