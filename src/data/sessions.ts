// Stage 1 Coach engine: a static session builder. Mock data only, no network and no database.
// Each session slot lists exercise ids by preference; the first one that fits the equipment and
// the joint toggles is picked, so the session changes with time, equipment and joints.

export type DayMode = 'flat' | 'surf'
export type TimeOption = 'express' | 'full'
export type EquipmentOption = 'bodyweight' | 'bands' | 'kettlebell' | 'gym'
export type JointOption = 'shoulders' | 'lowerBack'

export interface CoachSettings {
  time: TimeOption
  equipment: EquipmentOption
  joints: JointOption[]
}

export interface Exercise {
  id: string
  name: string
  dose: string
  /** Lowest equipment rank the exercise needs (0 bodyweight, 1 bands, 2 kettlebell / TRX, 3 full gym). */
  rank: number
  stress: { shoulders?: boolean; lowerBack?: boolean }
}

export interface CoachSession {
  title: string
  description: string
  durationMin: number
  equipmentTag: string
  focusTags: string[]
  exercises: Exercise[]
}

export const DEFAULT_SETTINGS: CoachSettings = { time: 'full', equipment: 'bands', joints: [] }

export const EQUIPMENT_RANK: Record<EquipmentOption, number> = {
  bodyweight: 0,
  bands: 1,
  kettlebell: 2,
  gym: 3,
}

export const EQUIPMENT_TAG: Record<EquipmentOption, string> = {
  bodyweight: 'Bodyweight Only',
  bands: 'Bodyweight + Bands',
  kettlebell: 'Bodyweight + Kettlebell / TRX',
  gym: 'Full Gym',
}

const LIBRARY: Exercise[] = [
  {
    id: 'thoracic-open-books',
    name: 'Thoracic Open Books',
    dose: '3 × 8 per side',
    rank: 0,
    stress: {},
  },
  {
    id: 'thoracic-extension',
    name: 'Foam Roller Thoracic Extension',
    dose: '3 × 10',
    rank: 0,
    stress: {},
  },
  {
    id: 'banded-external-rotations',
    name: 'Banded External Rotations',
    dose: '3 × 45s',
    rank: 1,
    stress: {},
  },
  {
    id: 'side-lying-external-rotation',
    name: 'Side-Lying External Rotation',
    dose: '3 × 12 per side',
    rank: 0,
    stress: {},
  },
  {
    id: 'kettlebell-overhead-press',
    name: 'Kettlebell Overhead Press',
    dose: '3 × 8 per side',
    rank: 2,
    stress: { shoulders: true },
  },
  { id: 'prone-ytw', name: 'Prone Y-T-W Raises', dose: '3 × 45s', rank: 0, stress: {} },
  { id: 'wall-slides', name: 'Wall Slides', dose: '3 × 10', rank: 0, stress: {} },
  { id: 'cable-face-pulls', name: 'Cable Face Pulls', dose: '3 × 12', rank: 3, stress: {} },
  { id: 'trx-rows', name: 'TRX Rows', dose: '3 × 10', rank: 2, stress: {} },
  { id: 'banded-paddle-pulls', name: 'Banded Paddle Pulls', dose: '3 × 45s', rank: 1, stress: {} },
  { id: 'band-pull-aparts', name: 'Band Pull-Aparts', dose: '3 × 15', rank: 1, stress: {} },
  { id: 'prone-swimmers', name: 'Prone Swimmers', dose: '3 × 30s', rank: 0, stress: {} },
  {
    id: 'kettlebell-swings',
    name: 'Kettlebell Swings',
    dose: '4 × 15',
    rank: 2,
    stress: { lowerBack: true },
  },
  {
    id: 'explosive-surf-pop-ups',
    name: 'Explosive Surf Pop-Ups',
    dose: '5 × 6',
    rank: 0,
    stress: { lowerBack: true },
  },
  { id: 'lateral-bounds', name: 'Lateral Bounds', dose: '3 × 6 per side', rank: 0, stress: {} },
  { id: 'cossack-squats', name: 'Cossack Squats', dose: '3 × 6 per side', rank: 0, stress: {} },
  { id: 'bird-dog', name: 'Bird Dog', dose: '3 × 8 per side', rank: 0, stress: {} },
  { id: 'dead-bug', name: 'Dead Bug', dose: '3 × 8 per side', rank: 0, stress: {} },
  { id: 'glute-bridge', name: 'Glute Bridge', dose: '3 × 12', rank: 0, stress: {} },
]

const BY_ID = new Map(LIBRARY.map((e) => [e.id, e]))

interface Ctx {
  equipment: EquipmentOption
  joints: JointOption[]
}

type Slot = (ctx: Ctx) => string[]

const hasShoulders = (c: Ctx) => c.joints.includes('shoulders')
const hasLowerBack = (c: Ctx) => c.joints.includes('lowerBack')

// Shoulders on: overhead work gives way to thoracic extension and external rotation.
const thoracicSlot: Slot = (c) =>
  hasShoulders(c)
    ? ['thoracic-extension', 'thoracic-open-books']
    : ['thoracic-open-books', 'thoracic-extension']

const FLAT_SLOTS: Slot[] = [
  thoracicSlot,
  () => ['banded-external-rotations', 'side-lying-external-rotation'],
  (c) =>
    hasShoulders(c)
      ? ['side-lying-external-rotation', 'wall-slides']
      : ['kettlebell-overhead-press', 'prone-ytw', 'wall-slides'],
  () => [
    'cable-face-pulls',
    'trx-rows',
    'banded-paddle-pulls',
    'band-pull-aparts',
    'prone-swimmers',
  ],
  () => ['kettlebell-swings', 'explosive-surf-pop-ups', 'lateral-bounds', 'cossack-squats'],
]

// Express (10 min) keeps the thoracic opener, the pull and the power block.
const EXPRESS_SLOTS: Slot[] = [FLAT_SLOTS[0], FLAT_SLOTS[3], FLAT_SLOTS[4]]

const SURF_SLOTS: Slot[] = [
  thoracicSlot,
  () => ['banded-external-rotations', 'side-lying-external-rotation'],
  () => ['wall-slides', 'prone-ytw'],
  () => ['bird-dog', 'dead-bug'],
  () => ['band-pull-aparts', 'glute-bridge'],
]

function fits(e: Exercise, c: Ctx): boolean {
  if (e.rank > EQUIPMENT_RANK[c.equipment]) return false
  if (e.stress.shoulders && hasShoulders(c)) return false
  if (e.stress.lowerBack && hasLowerBack(c)) return false
  return true
}

function pickExercises(slots: Slot[], ctx: Ctx): Exercise[] {
  const chosen: Exercise[] = []
  for (const slot of slots) {
    const pick = slot(ctx)
      .map((id) => BY_ID.get(id))
      .find((e): e is Exercise => !!e && fits(e, ctx) && !chosen.includes(e))
    if (pick) chosen.push(pick)
  }
  return chosen
}

function withLowerBackTag(base: string[], c: Ctx, tag: string): string[] {
  return hasLowerBack(c) ? [...base, tag] : base
}

export function buildSession(mode: DayMode, settings: CoachSettings): CoachSession {
  const ctx: Ctx = { equipment: settings.equipment, joints: settings.joints }
  const equipmentTag = EQUIPMENT_TAG[settings.equipment]

  if (mode === 'surf') {
    return {
      title: 'Pre-Surf Shoulder & Spine Activation',
      description: 'Surf Day · recovery routine',
      durationMin: 10,
      equipmentTag,
      focusTags: withLowerBackTag(['Thoracic Mobility', 'Rotator Cuff'], ctx, 'Spine Care'),
      exercises: pickExercises(SURF_SLOTS, ctx),
    }
  }

  const express = settings.time === 'express'
  return {
    title: express ? 'Express Paddle & Thoracic Power' : 'Paddle Endurance & Thoracic Power',
    description: express ? 'Flat Day · express training' : 'Flat Day · full training',
    durationMin: express ? 10 : 25,
    equipmentTag,
    focusTags: withLowerBackTag(['Paddle Power', 'Rotator Cuff'], ctx, 'Lower Back Care'),
    exercises: pickExercises(express ? EXPRESS_SLOTS : FLAT_SLOTS, ctx),
  }
}
