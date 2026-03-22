// Tailor design tokens — mirrors global.css CSS variables
// Use these anywhere you need JS-level access (charts, dynamic styles, canvas)

export const colors = {
  pink:         '#FFA9E7',
  pinkLight:    '#FFD6F3',
  pinkPale:     '#FFF0FB',
  pinkDark:     '#D4608A',
  pinkDeep:     '#8C2A56',

  brown:        '#463730',
  brownMid:     '#6B4F44',
  brownLight:   '#9A7A70',

  cream:        '#ECE2D0',
  creamDark:    '#C8B89A',
  creamPale:    '#FAF7F2',

  olive:        '#697A21',
  oliveLight:   '#A3B84A',
  olivePale:    '#D8E8A0',

  bg:           '#120A07',
  bgSurface:    '#1C1009',
  bgCard:       '#231208',
  bgRaised:     '#2E1A0D',
  bgHover:      '#3A2010',
  border:       '#3D2210',
  borderLight:  '#522E18',

  success:      '#697A21',
  danger:       '#C0392B',
  warning:      '#D48B30',
  info:         '#4A90B8',

  textPrimary:  '#F5EDE8',
  textSecondary:'#C8A898',
  textMuted:    '#7A5548',
  textFaint:    '#4A2E22',
}

// Chart.js / recharts palette — ordered by use priority
export const chartColors = {
  protein:  colors.pink,
  carbs:    colors.brownLight,
  fat:      colors.cream,
  fiber:    colors.oliveLight,
  calories: colors.pinkDark,
  strength: colors.pink,
  volume:   colors.oliveLight,
  weight:   colors.cream,
}

// Macro color map
export const macroColors = {
  protein: colors.pink,
  carbs:   colors.brownLight,
  fat:     colors.creamDark,
}

// Muscle group color map (for trophy case)
export const muscleColors = {
  chest:     colors.pink,
  back:      colors.pinkDark,
  shoulders: colors.cream,
  arms:      colors.oliveLight,
  legs:      colors.olive,
  core:      colors.brownLight,
  cardio:    colors.info,
  other:     colors.brownMid,
}

export const fonts = {
  display: "'DM Serif Display', Georgia, serif",
  body:    "'DM Sans', system-ui, sans-serif",
}

export const radius = {
  sm:   '8px',
  md:   '12px',
  lg:   '18px',
  xl:   '24px',
  full: '999px',
}

export const API_URL = import.meta.env.VITE_API_URL
