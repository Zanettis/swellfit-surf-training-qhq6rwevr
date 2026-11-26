import { Exercise, EquipmentTier } from '../types/swellfit'

/**
 * Static authentic exercise database with authentic biomechanically accurate
 * surf conditioning movements, surf transfer cues, and swap alternatives.
 */
export const EXERCISES: Exercise[] = [
  {
    id: 'prone-ytw-raises',
    name: 'Prone Y-T-W Raises',
    requiredEquipment: 'bodyweight',
    tags: ['Rotator Cuff', 'Thoracic Extension', 'Paddle Endurance'],
    contraindicatedJoints: [], // Safe for injured shoulders as rehab/prehab
    surfTransferCue:
      'Builds mid-back endurance so your neck and upper traps do not lock up after 90 minutes of constant paddling.',
    repsOrDuration: '3 sets × 10 reps each letter',
    defaultSeconds: 45,
    swapAlternatives: ['prone-swimmers', 'band-pull-aparts', 'thoracic-open-books'],
    pattern: 'extend',
  },
  {
    id: 'banded-external-rotations',
    name: 'Banded External Rotations',
    requiredEquipment: 'bands',
    tags: ['Rotator Cuff', 'Paddle Endurance'],
    contraindicatedJoints: [], // Gold standard rotator cuff stabilizer
    surfTransferCue:
      'Fortifies the infraspinatus and teres minor against swimmer-shoulder impingement from thousands of catch-phase strokes.',
    repsOrDuration: '3 sets × 15 reps / side',
    defaultSeconds: 40,
    swapAlternatives: ['prone-ytw-raises', 'band-pull-aparts', 'prone-swimmers'],
    pattern: 'rotate',
  },
  {
    id: 'banded-paddle-pulls',
    name: 'Banded Paddle Pulls',
    requiredEquipment: 'bands',
    tags: ['Paddle Endurance', 'Duck Dive Power'],
    contraindicatedJoints: [],
    surfTransferCue:
      'Replicates the high-elbow catch and late propulsion phase of surf paddling with continuous eccentric tension.',
    repsOrDuration: '3 sets × 20 fluid reps',
    defaultSeconds: 45,
    swapAlternatives: ['trx-rows', 'prone-swimmers', 'band-pull-aparts'],
    pattern: 'pull',
  },
  {
    id: 'thoracic-open-books',
    name: 'Thoracic Open Books',
    requiredEquipment: 'bodyweight',
    tags: ['Thoracic Extension', 'Rotator Cuff'],
    contraindicatedJoints: [], // Great for shoulder & lower back recovery
    surfTransferCue:
      'Unlocks mid-spine rotation essential for looking down the line and initiating backhand bottom turns without torquing your lumbar discs.',
    repsOrDuration: '2 sets × 8 slow reps / side',
    defaultSeconds: 40,
    swapAlternatives: ['cobra-childs-flow', 'hip-90-90-transitions', 'prone-ytw-raises'],
    pattern: 'rotate',
  },
  {
    id: 'explosive-surf-pop-ups',
    name: 'Explosive Surf Pop-Ups',
    requiredEquipment: 'bodyweight',
    tags: ['Pop-Up Power', 'Hip Mobility'],
    contraindicatedJoints: ['knee', 'lower-back'], // aggressive pop-up can aggravate lumbar/knee flexion
    surfTransferCue:
      'Drills rapid hip snap-under from plank to surf stance in under 0.4 seconds so you never miss critical wave entry.',
    repsOrDuration: '4 sets × 6 crisp reps',
    defaultSeconds: 35,
    swapAlternatives: ['supported-split-squats', 'hip-90-90-transitions', 'hollow-body-holds'],
    pattern: 'push',
  },
  {
    id: 'kettlebell-swings',
    name: 'Kettlebell Swings',
    requiredEquipment: 'home-setup',
    tags: ['Duck Dive Power', 'Pop-Up Power'],
    contraindicatedJoints: ['lower-back'], // contraindicated when lumbar discs are angry
    surfTransferCue:
      'Develops ballistic hip drive and posterior chain deceleration to brace against heavy shorebreak drop-ins.',
    repsOrDuration: '4 sets × 15 explosive reps',
    defaultSeconds: 40,
    swapAlternatives: ['supported-split-squats', 'cossack-squats', 'hollow-body-holds'],
    pattern: 'hinge',
  },
  {
    id: 'cossack-squats',
    name: 'Cossack Squats',
    requiredEquipment: 'bodyweight',
    tags: ['Hip Mobility', 'Pop-Up Power'],
    contraindicatedJoints: ['knee'], // deep lateral flexion stresses sensitive knee menisci
    surfTransferCue:
      'Restores groin and lateral hip capsule range for ultra-deep compression through steep rail transitions and cutbacks.',
    repsOrDuration: '3 sets × 8 reps / side',
    defaultSeconds: 45,
    swapAlternatives: ['supported-split-squats', 'hip-90-90-transitions', 'cobra-childs-flow'],
    pattern: 'squat',
  },
  {
    id: 'hollow-body-holds',
    name: 'Hollow Body Holds',
    requiredEquipment: 'bodyweight',
    tags: ['Duck Dive Power', 'Paddle Endurance'],
    contraindicatedJoints: [], // safe anti-extension core
    surfTransferCue:
      'Creates anterior core rigidity so your spine stays supported while arching your chest off the deck during marathon paddles.',
    repsOrDuration: '3 sets × 30-sec holds',
    defaultSeconds: 30,
    swapAlternatives: ['side-plank-rotations', 'prone-swimmers', 'cobra-childs-flow'],
    pattern: 'core',
  },
  {
    id: 'prone-swimmers',
    name: 'Prone Swimmers (Controlled Lift)',
    requiredEquipment: 'bodyweight',
    tags: ['Paddle Endurance', 'Thoracic Extension', 'Rotator Cuff'],
    contraindicatedJoints: [],
    surfTransferCue:
      'Simulates dynamic arm recovery and posterior chain activation during sprint paddling.',
    repsOrDuration: '3 sets × 12 reps',
    defaultSeconds: 40,
    swapAlternatives: ['prone-ytw-raises', 'band-pull-aparts', 'thoracic-open-books'],
    pattern: 'extend',
  },
  {
    id: 'side-plank-rotations',
    name: 'Side Plank with Rotational Reach',
    requiredEquipment: 'bodyweight',
    tags: ['Duck Dive Power', 'Hip Mobility'],
    contraindicatedJoints: ['shoulder'], // heavy unilateral shoulder loading
    surfTransferCue:
      'Builds oblique and lateral hip stability to resist being tumbled by white water during heavy duck dives.',
    repsOrDuration: '3 sets × 10 reps / side',
    defaultSeconds: 40,
    swapAlternatives: ['hollow-body-holds', 'hip-90-90-transitions', 'cobra-childs-flow'],
    pattern: 'core',
  },
  {
    id: 'band-pull-aparts',
    name: 'Band Pull-Aparts',
    requiredEquipment: 'bands',
    tags: ['Rotator Cuff', 'Thoracic Extension', 'Paddle Endurance'],
    contraindicatedJoints: [],
    surfTransferCue:
      'Counteracts rounded desk posture and primes rear deltoids and scapular retractors for ocean paddling posture.',
    repsOrDuration: '3 sets × 20 controlled reps',
    defaultSeconds: 35,
    swapAlternatives: ['prone-ytw-raises', 'banded-external-rotations', 'prone-swimmers'],
    pattern: 'pull',
  },
  {
    id: 'trx-rows',
    name: 'TRX / Inverted Suspension Rows',
    requiredEquipment: 'home-setup',
    tags: ['Duck Dive Power', 'Paddle Endurance'],
    contraindicatedJoints: [],
    surfTransferCue:
      'Develops latissimus pull strength and core anti-rotation needed to push your board deep under overhead sets.',
    repsOrDuration: '4 sets × 10 reps',
    defaultSeconds: 45,
    swapAlternatives: ['banded-paddle-pulls', 'band-pull-aparts', 'prone-swimmers'],
    pattern: 'pull',
  },
  {
    id: 'cobra-childs-flow',
    name: 'Cobra-to-Child’s Pose Spinal Flow',
    requiredEquipment: 'bodyweight',
    tags: ['Thoracic Extension', 'Hip Mobility'],
    contraindicatedJoints: [],
    surfTransferCue:
      'Decompresses lumbar facet joints while restoring thoracic extension after long hours arched on a fiberglass deck.',
    repsOrDuration: '8 slow flowing breath cycles',
    defaultSeconds: 40,
    swapAlternatives: ['thoracic-open-books', 'hip-90-90-transitions', 'prone-ytw-raises'],
    pattern: 'extend',
  },
  {
    id: 'hip-90-90-transitions',
    name: 'Hip 90/90 Internal & External Rotations',
    requiredEquipment: 'bodyweight',
    tags: ['Hip Mobility', 'Pop-Up Power'],
    contraindicatedJoints: [],
    surfTransferCue:
      'Increases rotational clearance in hip capsules to enable tight frontside rail carving without collapsing your stance.',
    repsOrDuration: '2 sets × 8 transitions / side',
    defaultSeconds: 45,
    swapAlternatives: ['cossack-squats', 'supported-split-squats', 'cobra-childs-flow'],
    pattern: 'rotate',
  },
  {
    id: 'supported-split-squats',
    name: 'Supported Iso-Split Squats',
    requiredEquipment: 'bodyweight',
    tags: ['Hip Mobility', 'Pop-Up Power'],
    contraindicatedJoints: [], // Safe knee & back friendly replacement for ballistic squats
    surfTransferCue:
      'Develops single-leg stability and ankle dorsiflexion for a centered, unbreakable stance on steep wave drops.',
    repsOrDuration: '3 sets × 10 reps / leg',
    defaultSeconds: 40,
    swapAlternatives: ['cossack-squats', 'hip-90-90-transitions', 'hollow-body-holds'],
    pattern: 'squat',
  },
  {
    id: 'heavy-overhead-press',
    name: 'Overhead Barbell / DB Press',
    requiredEquipment: 'gym',
    tags: ['Duck Dive Power', 'Pop-Up Power'],
    contraindicatedJoints: ['shoulder', 'neck-thoracic'], // Strictly excluded when shoulder guardrail is active
    surfTransferCue:
      'Builds raw vertical pushing power for heavy water hold-down resurfacing and duck-dive push depth.',
    repsOrDuration: '4 sets × 8 reps',
    defaultSeconds: 50,
    swapAlternatives: ['banded-paddle-pulls', 'trx-rows', 'banded-external-rotations'],
    pattern: 'push',
  },
]

export const EXERCISE_MAP = new Map<string, Exercise>(EXERCISES.map((ex) => [ex.id, ex]))

/** Equipment hierarchy: gym includes home-setup, bands, bodyweight */
export const EQUIPMENT_TIER_ORDER: Record<EquipmentTier, number> = {
  bodyweight: 0,
  bands: 1,
  'home-setup': 2,
  gym: 3,
}

export function isEquipmentCompatible(
  exerciseTier: EquipmentTier,
  userTier: EquipmentTier,
): boolean {
  return EQUIPMENT_TIER_ORDER[exerciseTier] <= EQUIPMENT_TIER_ORDER[userTier]
}
