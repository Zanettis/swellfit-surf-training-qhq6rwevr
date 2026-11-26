import {
  PrimaryGoal,
  BoardType,
  InjuryGuardrail,
  EquipmentTier,
  OceanContext,
  SurfDaySubtype,
  DurationChip,
  WorkoutSession,
  DayPlanPreview,
  Exercise,
  SurfBenefitTag,
} from '../types/swellfit'
import { EXERCISES, EXERCISE_MAP, isEquipmentCompatible } from './exercises'

export interface EngineInput {
  goal: PrimaryGoal
  boardType: BoardType
  injuryGuardrails: InjuryGuardrail[]
  equipment: EquipmentTier
  oceanContext: OceanContext
  surfSubtype?: SurfDaySubtype
  durationChip: DurationChip
  tripDaysRemaining?: number
}

/**
 * Pure filter engine: given athlete configuration, produces an authentic
 * personalized surf workout session and 7-day week schedule.
 * Rules:
 * - Contraindicated exercises for selected joints are excluded.
 * - Guardrail substitutions are prioritized (e.g. shoulder -> external rotation + thoracic extension).
 * - Equipment tier limits candidate pool.
 * - Ocean context shifts from full training to active pre/post surf routines.
 * - Duration chip determines exercise pool size (10 min express = 3-4 moves, 25 min full = 5-7 moves).
 */
export function deriveWorkoutSession(input: EngineInput): WorkoutSession {
  const {
    goal,
    boardType,
    injuryGuardrails,
    equipment,
    oceanContext,
    surfSubtype = 'pre-surf',
    durationChip,
  } = input

  const hasShoulderInjury = injuryGuardrails.includes('shoulder')
  const hasBackInjury = injuryGuardrails.includes('lower-back')
  const hasKneeInjury = injuryGuardrails.includes('knee')
  const hasNeckInjury = injuryGuardrails.includes('neck-thoracic')

  // Ocean Context handling: Surf Day
  if (oceanContext === 'surf') {
    if (surfSubtype === 'pre-surf') {
      const candidates: Exercise[] = [
        EXERCISE_MAP.get('thoracic-open-books')!,
        EXERCISE_MAP.get('prone-ytw-raises')!,
        EXERCISE_MAP.get('hip-90-90-transitions')!,
        EXERCISE_MAP.get('cobra-childs-flow')!,
      ].filter(Boolean)

      return {
        id: 'surf-day-pre-activation',
        title: 'Pre-Surf Shoulder & Spine Activation',
        context: 'surf',
        surfSubtype: 'pre-surf',
        durationMinutes: 10,
        equipmentTier: 'bodyweight',
        tags: ['Rotator Cuff', 'Thoracic Extension', 'Hip Mobility'],
        exercises: candidates,
        adaptiveExplanation:
          '10-minute dynamic neuromuscular warm-up primes rotator cuffs, opens thoracic spine, and activates hip rotators before ocean paddle-out.',
      }
    } else {
      // Post-surf recovery
      const candidates: Exercise[] = [
        EXERCISE_MAP.get('cobra-childs-flow')!,
        EXERCISE_MAP.get('thoracic-open-books')!,
        EXERCISE_MAP.get('hip-90-90-transitions')!,
        EXERCISE_MAP.get('prone-ytw-raises')!,
      ].filter(Boolean)

      return {
        id: 'surf-day-post-recovery',
        title: 'Post-Surf Decompression & Recovery',
        context: 'surf',
        surfSubtype: 'post-surf',
        durationMinutes: 10,
        equipmentTier: 'bodyweight',
        tags: ['Thoracic Extension', 'Hip Mobility', 'Rotator Cuff'],
        exercises: candidates,
        adaptiveExplanation:
          'Decompresses lumbar facet joints and releases cervical tension after paddling. Active recovery protects your training streak.',
      }
    }
  }

  // Flat Day (Full Training)
  // Step 1: Filter pool by equipment compatibility and contraindicated joint flags
  const safePool = EXERCISES.filter((ex) => {
    // Check equipment compatibility
    if (!isEquipmentCompatible(ex.requiredEquipment, equipment)) {
      return false
    }

    // Check joint contraindications
    if (hasShoulderInjury && ex.contraindicatedJoints.includes('shoulder')) return false
    if (hasBackInjury && ex.contraindicatedJoints.includes('lower-back')) return false
    if (hasKneeInjury && ex.contraindicatedJoints.includes('knee')) return false
    if (hasNeckInjury && ex.contraindicatedJoints.includes('neck-thoracic')) return false

    return true
  })

  // Prioritize exercises based on Goal and Board Type
  const targetTagPriorities: SurfBenefitTag[] = []
  let baseTitle = 'Paddle Endurance Ladder'

  switch (goal) {
    case 'surf-trip-prep':
      baseTitle = 'Surf Trip Readiness Complex'
      targetTagPriorities.push(
        'Paddle Endurance',
        'Pop-Up Power',
        'Rotator Cuff',
        'Duck Dive Power',
      )
      break
    case 'paddle-endurance':
      baseTitle = 'Paddle Endurance & Scapular Capacity'
      targetTagPriorities.push('Paddle Endurance', 'Thoracic Extension', 'Rotator Cuff')
      break
    case 'shoulder-longevity':
      baseTitle = 'Bulletproof Shoulders & Spine Prehab'
      targetTagPriorities.push('Rotator Cuff', 'Thoracic Extension', 'Paddle Endurance')
      break
    case 'popup-mobility':
      baseTitle = 'Explosive Pop-Up & Hip Clearance'
      targetTagPriorities.push('Pop-Up Power', 'Hip Mobility', 'Duck Dive Power')
      break
  }

  if (boardType === 'shortboard') {
    targetTagPriorities.unshift('Pop-Up Power', 'Duck Dive Power')
  } else if (boardType === 'longboard') {
    targetTagPriorities.unshift('Hip Mobility', 'Paddle Endurance')
  }

  // Guardrail priority overrides
  if (hasShoulderInjury) {
    targetTagPriorities.unshift('Rotator Cuff', 'Thoracic Extension')
  }

  // Score each safe exercise
  const scoredExercises = safePool.map((ex) => {
    let score = 0
    ex.tags.forEach((tag) => {
      const idx = targetTagPriorities.indexOf(tag)
      if (idx !== -1) {
        score += 10 - idx
      }
    })
    // Prefer matching equipment if available
    if (ex.requiredEquipment === equipment) score += 2
    return { ex, score }
  })

  // Sort descending by score
  scoredExercises.sort((a, b) => b.score - a.score)

  // Pick target count based on duration chip
  const targetCount = durationChip === '10' ? 3 : 5
  const selected: Exercise[] = []
  const usedPatterns = new Set<string>()

  for (const item of scoredExercises) {
    if (selected.length >= targetCount) break
    // diversify patterns if possible
    if (!usedPatterns.has(item.ex.pattern) || selected.length >= safePool.length / 2) {
      selected.push(item.ex)
      usedPatterns.add(item.ex.pattern)
    }
  }

  // Fallback if not enough diversified
  if (selected.length < targetCount) {
    for (const item of scoredExercises) {
      if (selected.length >= targetCount) break
      if (!selected.some((s) => s.id === item.ex.id)) {
        selected.push(item.ex)
      }
    }
  }

  // Collect active tags
  const tagsSet = new Set<SurfBenefitTag>()
  selected.forEach((ex) => ex.tags.forEach((t) => tagsSet.add(t)))
  const sessionTags = Array.from(tagsSet).slice(0, 4)

  // Construct adaptive explanation
  const explanations: string[] = []
  if (hasShoulderInjury) {
    explanations.push(
      'Heavy overhead pressing excluded; external rotation & thoracic extension prioritized',
    )
  }
  if (hasKneeInjury) {
    explanations.push('High-torque knee flexion modified for hip-dominant alignment')
  }
  if (hasBackInjury) {
    explanations.push(
      'Lumbar shear movements filtered; anterior core bracing & gentle decompression selected',
    )
  }
  if (equipment === 'bodyweight') {
    explanations.push('Apartment/travel bodyweight load scheme calibrated')
  } else if (equipment === 'home-setup') {
    explanations.push('Kettlebell and suspension strength mechanics integrated')
  }

  const finalExplanation =
    explanations.length > 0
      ? explanations.join(' · ')
      : `${boardType === 'shortboard' ? 'Shortboard agility' : boardType === 'longboard' ? 'Longboard glide & hip clearance' : 'Balanced paddle volume'} calibrated for ${equipment} setup.`

  return {
    id: `session-${goal}-${durationChip}-${equipment}`,
    title: durationChip === '10' ? `${baseTitle} (Express)` : baseTitle,
    context: 'flat',
    durationMinutes: durationChip === '10' ? 10 : 25,
    equipmentTier: equipment,
    tags: sessionTags.length ? sessionTags : ['Paddle Endurance', 'Thoracic Extension'],
    exercises: selected,
    adaptiveExplanation: finalExplanation,
  }
}

/**
 * Derives 7-day Week 1 preview schedule strictly through the filter engine
 */
export function deriveWeek1Schedule(
  input: Omit<EngineInput, 'durationChip' | 'oceanContext'>,
): DayPlanPreview[] {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const templates = [
    { title: 'Paddle Endurance Ladder', duration: 25, isRest: false, chip: '25' as DurationChip },
    {
      title: 'Thoracic Mobility & Rotator Prehab',
      duration: 15,
      isRest: false,
      chip: '10' as DurationChip,
    },
    {
      title: 'Active Recovery / Ocean Float',
      duration: 10,
      isRest: true,
      chip: '10' as DurationChip,
    },
    {
      title: 'Explosive Pop-Up & Hip Clearance',
      duration: 25,
      isRest: false,
      chip: '25' as DurationChip,
    },
    {
      title: 'Duck-Dive Core & Rotational Drive',
      duration: 20,
      isRest: false,
      chip: '25' as DurationChip,
    },
    {
      title: 'Weekend Surf Session (Pre-Activation)',
      duration: 10,
      isRest: false,
      chip: '10' as DurationChip,
    },
    {
      title: 'Deep Spine Decompression & Rest',
      duration: 10,
      isRest: true,
      chip: '10' as DurationChip,
    },
  ]

  return templates.map((tmpl, idx) => {
    const session = deriveWorkoutSession({
      ...input,
      oceanContext: idx === 5 ? 'surf' : 'flat',
      surfSubtype: 'pre-surf',
      durationChip: tmpl.chip,
    })

    return {
      dayLabel: dayNames[idx],
      dayIndex: idx,
      title: tmpl.title,
      durationMinutes: tmpl.duration,
      isRest: tmpl.isRest,
      tags: session.tags,
      exercises: session.exercises,
    }
  })
}

/**
 * Returns valid, safe swap alternatives for a given exercise
 */
export function getValidSwapsForExercise(
  exercise: Exercise,
  userEquipment: EquipmentTier,
  guardrails: InjuryGuardrail[],
): Exercise[] {
  const hasShoulder = guardrails.includes('shoulder')
  const hasBack = guardrails.includes('lower-back')
  const hasKnee = guardrails.includes('knee')
  const hasNeck = guardrails.includes('neck-thoracic')

  const candidateIds = exercise.swapAlternatives

  const swaps: Exercise[] = []
  for (const id of candidateIds) {
    const candidate = EXERCISE_MAP.get(id)
    if (!candidate) continue
    if (!isEquipmentCompatible(candidate.requiredEquipment, userEquipment)) continue
    if (hasShoulder && candidate.contraindicatedJoints.includes('shoulder')) continue
    if (hasBack && candidate.contraindicatedJoints.includes('lower-back')) continue
    if (hasKnee && candidate.contraindicatedJoints.includes('knee')) continue
    if (hasNeck && candidate.contraindicatedJoints.includes('neck-thoracic')) continue
    swaps.push(candidate)
  }

  // If swaps list is small, supplement with any safe exercise with similar pattern or tags
  if (swaps.length < 2) {
    for (const ex of EXERCISES) {
      if (ex.id === exercise.id || swaps.some((s) => s.id === ex.id)) continue
      if (!isEquipmentCompatible(ex.requiredEquipment, userEquipment)) continue
      if (hasShoulder && ex.contraindicatedJoints.includes('shoulder')) continue
      if (hasBack && ex.contraindicatedJoints.includes('lower-back')) continue
      if (hasKnee && ex.contraindicatedJoints.includes('knee')) continue
      if (hasNeck && ex.contraindicatedJoints.includes('neck-thoracic')) continue
      swaps.push(ex)
      if (swaps.length >= 3) break
    }
  }

  return swaps.slice(0, 4)
}

/**
 * Calculates surf trip countdown info
 */
export function calculateTripCountdown(departureDateStr?: string) {
  if (!departureDateStr) {
    return {
      daysRemaining: 28,
      weeksRemaining: 4,
      phaseNumber: 1,
      phaseName: 'Phase 1: Paddle Base',
      progressPercent: 35,
    }
  }

  const now = new Date()
  const dep = new Date(departureDateStr)
  const diffMs = dep.getTime() - now.getTime()
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const weeks = Math.max(1, Math.ceil(days / 7))

  let phaseNumber = 1
  let phaseName = 'Phase 1: Paddle Base'
  let progressPercent = 20

  if (days <= 14) {
    phaseNumber = 3
    phaseName = 'Phase 3: Peak / Surf-Specific'
    progressPercent = 85
  } else if (days <= 28) {
    phaseNumber = 2
    phaseName = 'Phase 2: Power & Duck Dive Capacity'
    progressPercent = 55
  } else {
    phaseNumber = 1
    phaseName = 'Phase 1: Paddle Base'
    progressPercent = 25
  }

  return {
    daysRemaining: days,
    weeksRemaining: weeks,
    phaseNumber,
    phaseName,
    progressPercent,
  }
}
