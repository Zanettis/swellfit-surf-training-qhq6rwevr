import type { SessionSlotId, SurfSubMode } from '@/data/player-types'

/** Every slot a session can fill: four weekly archetypes, or one surf routine. */
export type SlotId = SessionSlotId | SurfSubMode
