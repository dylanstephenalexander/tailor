import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getLog, getAlerts } from '../api/nutrition'
import { getRecommendations } from '../api/profile'
import styles from '../styles/Nutrition.module.css'

const today = () => new Date().toISOString().split('T')[0]

const RDV_FEMALE = {
  vitamin_a: { value: 700, unit: 'mcg' },
  vitamin_c: { value: 75, unit: 'mg' },
  vitamin_d: { value: 15, unit: 'mcg' },
  vitamin_e: { value: 15, unit: 'mg' },
  vitamin_k: { value: 90, unit: 'mcg' },
  vitamin_b6: { value: 1.3, unit: 'mg' },
  vitamin_b12: { value: 2.4, unit: 'mcg' },
  folate: { value: 400, unit: 'mcg' },
  thiamin: { value: 1.1, unit: 'mg' },
  riboflavin: { value: 1.1, unit: 'mg' },
  niacin: { value: 14, unit: 'mg' },
  pantothenic_acid: { value: 5, unit: 'mg' },
  biotin: { value: 30, unit: 'mcg' },
  choline: { value: 425, unit: 'mg' },
  calcium: { value: 1000, unit: 'mg' },
  iron: { value: 18, unit: 'mg' },
  magnesium: { value: 310, unit: 'mg' },
  zinc: { value: 8, unit: 'mg' },
  potassium: { value: 2600, unit: 'mg' },
  sodium: { value: 2300, unit: 'mg' },
  selenium: { value: 55, unit: 'mcg' },
  iodine: { value: 150, unit: 'mcg' },
  phosphorus: { value: 700, unit: 'mg' },
  omega_3: { value: 1100, unit: 'mg' },
  fiber: { value: 25, unit: 'g' },
  cholesterol: { value: 300, unit: 'mg' },
  saturated_fat: { value: 20, unit: 'g' },
}

const NUTRIENT_LABELS = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbohydrates',
  fat: 'Total Fat',
  fiber: 'Fiber',
  sugar: 'Sugar',
  saturated_fat: 'Saturated Fat',
  trans_fat: 'Trans Fat',
  cholesterol: 'Cholesterol',
  polyunsaturated_fat: 'Polyunsaturated Fat',
  monounsaturated_fat: 'Monounsaturated Fat',
  omega_3: 'Omega-3',
  omega_6: 'Omega-6',
  sodium: 'Sodium',
  potassium: 'Potassium',
  calcium: 'Calcium',
  iron: 'Iron',
  magnesium: 'Magnesium',
  zinc: 'Zinc',
  phosphorus: 'Phosphorus',
  selenium: 'Selenium',
  iodine: 'Iodine',
  vitamin_a: 'Vitamin A',
  vitamin_c: 'Vitamin C',
  vitamin_d: 'Vitamin D',
  vitamin_e: 'Vitamin E',
  vitamin_k: 'Vitamin K',
  vitamin_b6: 'Vitamin B6',
  vitamin_b12: 'Vitamin B12',
  folate: 'Folate',
  thiamin: 'Thiamin',
  riboflavin: 'Riboflavin',
  niacin: 'Niacin',
  pantothenic_acid: 'Pantothenic Acid',
  biotin: 'Biotin',
  choline: 'Choline',
}

const getBarColor = (pct) => {
  if (pct >= 100) return 'var(--primary)'
  if (pct >= 75) return '#E8B4BC'
  if (pct >= 50) return 'var(--muted)'
  return '#E8B4BC'
}

export default function Nutrition() {
  const navigate = useNavigate()
  const [log, setLog] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getLog(today()),
      getAlerts(),
      getRecommendations(),
    ]).then(([logRes, alertsRes, recRes]) => {
      setLog(logRes.data)
      setAlerts(alertsRes.data.alerts || [])
      setRecommendations(recRes.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>
      Loading...
    </div>
  )

  const totals = log?.totals || {}
  const calorieTarget = recommendations?.calorie_target || 2000
  const proteinTarget = recommendations?.protein_target_g || 120
  const fiberTarget = recommendations?.fiber_target_g || 25

  const macros = [
    { key: 'calories', value: totals.calories, target: calorieTarget, unit: 'kcal' },
    { key: 'protein', value: totals.protein, target: proteinTarget, unit: 'g' },
    { key: 'carbs', value: totals.carbs, target: Math.round(calorieTarget * 0.45 / 4), unit: 'g' },
    { key: 'fat', value: totals.fat, target: Math.round(calorieTarget * 0.30 / 9), unit: 'g' },
  ]

  const microKeys = Object.keys(RDV_FEMALE)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Nutrition</h1>
      </div>

      {/* macro summary */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Macros</div>
        <div className={styles.macroSummary}>
          {macros.map(({ key, value, target, unit }) => {
            const pct = Math.min(Math.round(((value || 0) / target) * 100), 100)
            return (
              <div key={key} className={styles.macroCard}>
                <div className={styles.macroCardLabel}>{NUTRIENT_LABELS[key]}</div>
                <div className={styles.macroCardValue}>
                  {Math.round(value || 0)}
                  <span className={styles.macroCardUnit}>{unit}</span>
                </div>
                <div className={styles.macroCardTarget}>of {Math.round(target)}{unit}</div>
                <div className={styles.macroCardBar}>
                  <div
                    className={styles.macroCardBarFill}
                    style={{ width: `${pct}%`, background: getBarColor(pct) }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* alerts */}
      {alerts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Alerts</div>
          {alerts.slice(0, 3).map(alert => (
            <div key={alert.nutrient} className={styles.alertBanner}>
              <div className={styles.alertIcon}>⚠️</div>
              <div className={styles.alertText}>
                <span className={styles.alertNutrient}>{NUTRIENT_LABELS[alert.nutrient] || alert.nutrient}</span>
                {' '}— {alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* micros */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Micronutrients</div>
        <div className={styles.card}>
          {microKeys.map(key => {
            const rdv = RDV_FEMALE[key]
            const value = totals[key] || 0
            const pct = Math.min(Math.round((value / rdv.value) * 100), 100)
            return (
              <div key={key} className={styles.nutrientRow}>
                <div className={styles.nutrientLeft}>
                  <div className={styles.nutrientName}>{NUTRIENT_LABELS[key] || key}</div>
                  <div className={styles.nutrientBar}>
                    <div
                      className={styles.nutrientBarFill}
                      style={{ width: `${pct}%`, background: getBarColor(pct) }}
                    />
                  </div>
                </div>
                <div className={styles.nutrientRight}>
                  <div className={styles.nutrientValue}>
                    {value < 1 ? value.toFixed(2) : Math.round(value)}
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>{rdv.unit}</span>
                  </div>
                  <div className={styles.nutrientTarget}>of {rdv.value}{rdv.unit}</div>
                  <div
                    className={styles.nutrientPct}
                    style={{ color: pct >= 75 ? 'var(--primary)' : 'var(--muted)' }}
                  >
                    {pct}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}