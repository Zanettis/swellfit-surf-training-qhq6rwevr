import { Program } from '../types/swellfit'

export const SWELLFIT_PROGRAMS: Program[] = [
  {
    id: 'surf-trip-countdown',
    name: '6-Week Surf Trip Countdown',
    durationWeeks: 6,
    focus: 'Periodized progression: paddle base volume → wave entry power → peak surf endurance.',
    progressPercent: 35,
    savedOffline: false,
    phases: [
      {
        phaseNumber: 1,
        name: 'Phase 1: Paddle Base & Scapular Foundation',
        weeksRange: 'Weeks 1–2',
        focus:
          'Builds continuous paddle stroke endurance, fixes thoracic kyphosis, and conditions the rotator cuff.',
        sessionsPerWeek: 4,
      },
      {
        phaseNumber: 2,
        name: 'Phase 2: Duck-Dive Power & Hip Deceleration',
        weeksRange: 'Weeks 3–4',
        focus:
          'Introduces explosive core drive and hip hinges for punchy beach breaks and reef drop-ins.',
        sessionsPerWeek: 4,
      },
      {
        phaseNumber: 3,
        name: 'Phase 3: Peak / Surf-Specific Agility & Breath',
        weeksRange: 'Weeks 5–6',
        focus:
          'High-frequency pop-up speed, CO2 apnea tolerance under heart rate, and marathon heat simulation.',
        sessionsPerWeek: 5,
      },
    ],
    weeklyStructure: [
      {
        dayLabel: 'Day 1',
        sessionTitle: 'Continuous Paddle Volume & Scapular Control',
        durationMinutes: 25,
        focusTags: ['Paddle Endurance', 'Rotator Cuff'],
      },
      {
        dayLabel: 'Day 2',
        sessionTitle: 'Thoracic Mobility & Spinal Decompression',
        durationMinutes: 15,
        focusTags: ['Thoracic Extension', 'Hip Mobility'],
      },
      {
        dayLabel: 'Day 3',
        sessionTitle: 'Duck-Dive Anterior Core & Lat Pull',
        durationMinutes: 25,
        focusTags: ['Duck Dive Power', 'Paddle Endurance'],
      },
      {
        dayLabel: 'Day 4',
        sessionTitle: 'Explosive Pop-Up Intervals & Split Stance',
        durationMinutes: 20,
        focusTags: ['Pop-Up Power', 'Hip Mobility'],
      },
    ],
    injuryNotes:
      'Automatically adjusts overhead pressing and high-impact pop-up drop volume when guardrails are detected.',
  },
  {
    id: 'endless-paddle-endurance',
    name: 'Endless Paddle Endurance',
    durationWeeks: 4,
    focus:
      'Maximize continuous ocean paddle stamina, wave catch capacity, and high-elbow stroke efficiency.',
    progressPercent: 60,
    savedOffline: true,
    phases: [
      {
        phaseNumber: 1,
        name: 'Phase 1: Rear-Delt & Scapular Capacity',
        weeksRange: 'Weeks 1–2',
        focus:
          'High-rep isometric prone conditioning to eradicate the burning sensation between shoulder blades.',
        sessionsPerWeek: 3,
      },
      {
        phaseNumber: 2,
        name: 'Phase 2: Catch-Phase Power & Sprints',
        weeksRange: 'Weeks 3–4',
        focus:
          'Band and bodyweight propulsion tempo to catch rolling swells before they feather and break.',
        sessionsPerWeek: 4,
      },
    ],
    weeklyStructure: [
      {
        dayLabel: 'Day 1',
        sessionTitle: 'Prone Y-T-W & Swimmer Endurance Ladder',
        durationMinutes: 25,
        focusTags: ['Rotator Cuff', 'Thoracic Extension'],
      },
      {
        dayLabel: 'Day 2',
        sessionTitle: 'Banded High-Elbow Pull Sprints',
        durationMinutes: 20,
        focusTags: ['Paddle Endurance', 'Duck Dive Power'],
      },
      {
        dayLabel: 'Day 3',
        sessionTitle: 'Hollow Body Core Deck Bracing',
        durationMinutes: 15,
        focusTags: ['Duck Dive Power', 'Thoracic Extension'],
      },
    ],
    injuryNotes:
      'Rotator cuff safe. Prioritizes horizontal pulling and external rotation over vertical compression.',
  },
  {
    id: 'bulletproof-shoulders-back',
    name: 'Bulletproof Shoulders & Lower Back (10-min Daily Prehab)',
    durationWeeks: 4,
    focus:
      'Daily micro-doses of physical-therapy-grade prehab to bulletproof joints against chronic surf mileage.',
    progressPercent: 20,
    savedOffline: false,
    phases: [
      {
        phaseNumber: 1,
        name: 'Phase 1: Decompression & Rotator Cuff Centration',
        weeksRange: 'Weeks 1–2',
        focus:
          'Humeral head seating, subscapularis and infraspinatus balancing, lumbar facet gentle gliding.',
        sessionsPerWeek: 6,
      },
      {
        phaseNumber: 2,
        name: 'Phase 2: Dynamic Loaded Mobility & Spine Resiliency',
        weeksRange: 'Weeks 3–4',
        focus:
          'Integrates thoracic rotation under mild resistance to guard against sudden heavy wipeout torque.',
        sessionsPerWeek: 6,
      },
    ],
    weeklyStructure: [
      {
        dayLabel: 'Daily Routine',
        sessionTitle: '10-Min Prehab Flow (Shoulder, Thoracic & Spine)',
        durationMinutes: 10,
        focusTags: ['Rotator Cuff', 'Thoracic Extension', 'Hip Mobility'],
      },
      {
        dayLabel: 'Decompression',
        sessionTitle: 'Cobra-Child Flow & Open Book Rotations',
        durationMinutes: 10,
        focusTags: ['Thoracic Extension', 'Hip Mobility'],
      },
    ],
    injuryNotes:
      'Designed specifically for surfers with existing rotator cuff and lower back histories.',
  },
  {
    id: 'explosive-popup-hip-mobility',
    name: 'Explosive Pop-Up & Hip Mobility',
    durationWeeks: 4,
    focus:
      'Fast-twitch hip flexion, pop-up sub-0.4s snap, deep rail compression, and frontside ankle clearance.',
    progressPercent: 10,
    savedOffline: false,
    phases: [
      {
        phaseNumber: 1,
        name: 'Phase 1: Hip Capsule Clearance & Core Snap',
        weeksRange: 'Weeks 1–2',
        focus:
          '90/90 mobility and hollow snap-through mechanics from prone belly to low athletic stance.',
        sessionsPerWeek: 3,
      },
      {
        phaseNumber: 2,
        name: 'Phase 2: Ballistic Landing & Asymmetrical Stance',
        weeksRange: 'Weeks 3–4',
        focus:
          'Reactive split squats and pop-ups on unstable surfaces to simulate chop and steep late drops.',
        sessionsPerWeek: 4,
      },
    ],
    weeklyStructure: [
      {
        dayLabel: 'Day 1',
        sessionTitle: 'Pop-Up Decoupling & Hip Snap-Under',
        durationMinutes: 20,
        focusTags: ['Pop-Up Power', 'Hip Mobility'],
      },
      {
        dayLabel: 'Day 2',
        sessionTitle: 'Cossack Squats & Lateral Groin Expansion',
        durationMinutes: 20,
        focusTags: ['Hip Mobility', 'Pop-Up Power'],
      },
      {
        dayLabel: 'Day 3',
        sessionTitle: 'Rapid Reactive Pop-Up Intervals',
        durationMinutes: 15,
        focusTags: ['Pop-Up Power', 'Duck Dive Power'],
      },
    ],
    injuryNotes:
      'Knee guardrail automatically substitutes supported split squats for deep Cossack squats.',
  },
  {
    id: 'flat-day-surfskate-drills',
    name: 'Flat-Day Surfskate Drills',
    durationWeeks: 4,
    focus:
      'Authentic ocean-transfer biomechanics: compression, extension, bottom turn & cutback drills without wiggling.',
    progressPercent: 0,
    savedOffline: false,
    phases: [
      {
        phaseNumber: 1,
        name: 'Phase 1: True Rail Generation (No Wiggling)',
        weeksRange: 'Weeks 1–2',
        focus:
          'Eliminates ankle wiggling; generates propulsion via full kinetic chain compression and ankle flexion.',
        sessionsPerWeek: 3,
      },
      {
        phaseNumber: 2,
        name: 'Phase 2: Bottom Turn Compression & Pocket Cutbacks',
        weeksRange: 'Weeks 3–4',
        focus:
          'Rotational upper body disassociation, leading arm gaze, and rail transition timing on flat tarmac.',
        sessionsPerWeek: 3,
      },
    ],
    weeklyStructure: [
      {
        dayLabel: 'Drill A',
        sessionTitle: 'Knee & Ankle Compression Alignment Drills',
        durationMinutes: 25,
        focusTags: ['Hip Mobility', 'Pop-Up Power'],
      },
      {
        dayLabel: 'Drill B',
        sessionTitle: 'Bottom Turn Projection & Head-Torso Leading',
        durationMinutes: 25,
        focusTags: ['Thoracic Extension', 'Hip Mobility'],
      },
      {
        dayLabel: 'Drill C',
        sessionTitle: 'Pocket Cutback Rebound & Rail Deceleration',
        durationMinutes: 20,
        focusTags: ['Hip Mobility', 'Duck Dive Power'],
      },
    ],
    injuryNotes:
      'Emphasizes low-impact postural alignment; safe for joints under proper surfskate gear and footwear.',
  },
]
