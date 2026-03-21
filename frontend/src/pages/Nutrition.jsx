import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLog, getAlerts } from '../api/nutrition'
import { getRecommendations } from '../api/profile'
import BottomNav from '../components/BottomNav'
import PageHeader from '../components/PageHeader'
import SectionLabel from '../components/SectionLabel'
import Card from '../components/Card'
import LoadingScreen from '../components/LoadingScreen'
import styles from '../styles/Nutrition.module.css'

const today = () => new Date().toISOString().split('T')[0]

const RDV = {
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

const LABELS = {
  calories: 'Calories', protein: 'Protein', carbs: 'Carbohydrates', fat: 'Total Fat',
  fiber: 'Fiber', sugar: 'Sugar', saturated_fat: 'Saturated Fat', trans_fat: 'Trans Fat',
  cholesterol: 'Cholesterol', omega_3: 'Omega-3', omega_6: 'Omega-6', sodium: 'Sodium',
  potassium: 'Potassium', calcium: 'Calcium', iron: 'Iron', magnesium: 'Magnesium',
  zinc: 'Zinc', phosphorus: 'Phosphorus', selenium: 'Selenium', iodine: 'Iodine',
  vitamin_a: 'Vitamin A', vitamin_c: 'Vitamin C', vitamin_d: 'Vitamin D',
  vitamin_e: 'Vitamin E', vitamin_k: 'Vitamin K', vitamin_b6: 'Vitamin B6',
  vitamin_b12: 'Vitamin B12', folate: 'Folate', thiamin: 'Thiamin',
  riboflavin: 'Riboflavin', niacin: 'Niacin', pantothenic_acid: 'Pantothenic Acid',
  biotin: 'Biotin', choline: 'Choline',
}

const barColor = (pct) => pct >= 100 ? 'var(--primary)' : pct >= 75 ? '#E8B4BC' : 'var(--muted)'

export default function Nutrition() {
  const navigate = useNavigate()
  const [log, setLog] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getLog(today()), getAlerts(), getRecommendations()])
      .then(([logRes, alertsRes, recRes]) => {
        setLog(logRes.data)
        setAlerts(alertsRes.data.alerts || [])
        setRecommendations(recRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />

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

  return (
    <div className={styles.page}>
      <PageHeader title="Nutrition" backTo="/" />

      <div className={styles.section}>
        <SectionLabel>Macros</SectionLabel>
        <div className={styles.macroSummary}>
          {macros.map(({ key, value, target, unit }) => {
            const pct = Math.min(Math.round(((value || 0) / target) * 100), 100)
            return (
              <div key={key} className={styles.macroCard}>
                <div className={styles.macroCardLabel}>{LABELS[key]}</div>
                <div className={styles.macroCardValue}>
                  {Math.round(value || 0)}<span className={styles.macroCardUnit}>{unit}</span>
                </div>
                <div className={styles.macroCardTarget}>of {Math.round(target)}{unit}</div>
                <div className={styles.macroCardBar}>
                  <div className={styles.macroCardBarFill} style={{ width: `${pct}%`, background: barColor(pct) }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {alerts.length > 0 && (
        <div className={styles.section}>
          <SectionLabel>Alerts</SectionLabel>
          {alerts.slice(0, 3).map(alert => (
            <div key={alert.nutrient} className={styles.alertBanner}>
              <div className={styles.alertIcon}>⚠️</div>
              <div className={styles.alertText}>
                <span className={styles.alertNutrient}>{LABELS[alert.nutrient] || alert.nutrient}</span>
                {' '}— {alert.message}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <SectionLabel>Micronutrients</SectionLabel>
        <div className={styles.card}>
          {Object.keys(RDV).map(key => {
            const rdv = RDV[key]
            const value = totals[key] || 0
            const pct = Math.min(Math.round((value / rdv.value) * 100), 100)
            return (
              <div key={key} className={styles.nutrientRow}>
                <div className={styles.nutrientLeft}>
                  <div className={styles.nutrientName}>{LABELS[key] || key}</div>
                  <div className={styles.nutrientBar}>
                    <div className={styles.nutrientBarFill} style={{ width: `${pct}%`, background: barColor(pct) }} />
                  </div>
                </div>
                <div className={styles.nutrientRight}>
                  <div className={styles.nutrientValue}>
                    {value < 1 ? value.toFixed(2) : Math.round(value)}
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>{rdv.unit}</span>
                  </div>
                  <div className={styles.nutrientTarget}>of {rdv.value}{rdv.unit}</div>
                  <div className={styles.nutrientPct} style={{ color: pct >= 75 ? 'var(--primary)' : 'var(--muted)' }}>{pct}%</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}