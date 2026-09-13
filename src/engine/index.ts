import catalogue from '../../data/catalogue.json';
import { HackSchema, type Hack } from '../schema/hack';

export const hacks: Hack[] = catalogue.map(hack => HackSchema.parse(hack));
export * from './time';
export * from './pace';
export * from './platforms';
export * from './validity';
export * from './match';
export * from './score';
export * from './journeys';
