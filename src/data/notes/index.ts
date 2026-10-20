import type { YearNote } from './types';
import { INFANT_NOTES } from './infant';
import { CHILD_NOTES } from './child';
import { TEEN_NOTES } from './teen';
import { YOUNG_NOTES } from './young';
import { MIDDLE_NOTES } from './middle';
import { ELDER_NOTES } from './elder';
import { JOB_NOTES } from './job';

export type { YearNote } from './types';

export const YEAR_NOTES: YearNote[] = [
  ...INFANT_NOTES, ...CHILD_NOTES, ...TEEN_NOTES, ...YOUNG_NOTES, ...MIDDLE_NOTES, ...ELDER_NOTES, ...JOB_NOTES,
];
