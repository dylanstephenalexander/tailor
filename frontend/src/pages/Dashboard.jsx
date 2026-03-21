import { useState, useEffect } from 'react'
import { getDashboard } from '../api/dashboard'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Dumbbell, User } from 'lucide-react'
import CutsceneModal from '../components/CutsceneModal'
import styles from '../styles/Dashboard.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cutscene, setCutscene] = useState(null)

  useEffect(() => {
    getDashboard(today())
      .then(res => {
        setData(res.data)
        if (res.data.cutscenes?.length > 0) {
          const dismissed = JSON.parse(sessionStorage.getItem('dismissed_cutscenes') || '[]')
          const pending = res.data.cutscenes.filter(c => !dismissed.includes(`${c}_${today()}`))
          if (pending.length > 0) {
            setCutscene(pending[0])
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDismissCutscene = (key) => {
    const dismissed = JSON.parse(sessionStorage.getItem('dismissed_cutscenes') || '[]')
    dismissed.push(`${key}_${today()}`)
    sessionStorage.setItem('dismissed_cutscenes', JSON.stringify(dismissed))
    setCutscene(null)
  }

  if (loading) return <div className={styles.loading}>Loading...</div>

  const totals = data?.food?.totals || {}
  const recommendations = data?.recommendations
  const calorieTarget = recommendations?.calorie_target || 2000
  const proteinTarget = recommendations?.protein_target_g || 120
  const carbTarget = Math.round(calorieTarget * 0.45 / 4)
  const fatTarget = Math.round(calorieTarget * 0.30 / 9)
  const caloriePercent = Math.min((totals.calories / calorieTarget) * 100, 100)
  const remaining = Math.max(Math.round(calorieTarget - totals.calories), 0)

  const greeting = () => {
    const hour = new Date().getHours()
    const name = data?.profile?.username || 'love'
    if (hour < 12) return { prefix: 'Good morning', name }
    if (hour < 17) return { prefix: 'Good afternoon', name }
    return { prefix: 'Good evening', name }
  }

  const formatDate = () => new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  const { prefix, name } = greeting()

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Food', path: '/food', icon: Search },
    { label: 'Workouts', path: '/workouts', icon: Dumbbell },
    { label: 'Profile', path: '/profile', icon: User },
  ]

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div className={styles.greeting}>
          {prefix}, <span className={styles.greetingName}>{name}.</span>
        </div>
        <div className={styles.date}>{formatDate()}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Calories</div>
        <div className={styles.calorieCard}>
          <div className={styles.calorieTop}>
            <div>
              <div className={styles.calorieNumber}>{Math.round(totals.calories).toLocaleString()}</div>
              <div className={styles.calorieSubLabel}>consumed today</div>
            </div>
            <div className={styles.calorieRemaining}>
              <div className={styles.calorieRemainingNum}>{remaining.toLocaleString()}</div>
              <div className={styles.calorieRemainingLabel}>remaining</div>
            </div>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${caloriePercent}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.macroGrid}>
          {[
            { label: 'Protein', value: totals.protein, target: proteinTarget, color: 'var(--primary)' },
            { label: 'Carbs', value: totals.carbs, target: carbTarget, color: '#E8B4BC' },
            { label: 'Fat', value: totals.fat, target: fatTarget, color: 'var(--muted)' },
          ].map(({ label, value, target, color }) => (
            <div key={label} className={styles.macroCard}>
              <div className={styles.macroName}>{label}</div>
              <div className={styles.macroValue}>
                {Math.round(value || 0)}<span className={styles.macroUnit}>g</span>
              </div>
              <div className={styles.macroBar}>
                <div
                  className={styles.macroBarFill}
                  style={{
                    width: `${Math.min(((value || 0) / target) * 100, 100)}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Today's meals</div>
        <div className={styles.mealList}>
          {data?.food?.entries?.length === 0 && (
            <div className={styles.emptyState}>Nothing logged yet</div>
          )}
          {data?.food?.entries?.map(entry => (
            <div key={entry.id} className={styles.mealRow}>
              <div className={styles.mealLeft}>
                <div className={styles.mealDot} />
                <div>
                  <div className={styles.mealName}>{entry.food.name}</div>
                  <div className={styles.mealMeta}>
                    {entry.meal_type} · {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className={styles.mealCal}>{Math.round(entry.food.calories * entry.servings)}</div>
            </div>
          ))}
        </div>
        <button className={styles.logButton} onClick={() => navigate('/food')}>
          + Log food
        </button>
        <button
          onClick={() => navigate('/nutrition')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: 13,
            cursor: 'pointer',
            width: '100%',
            marginTop: 8,
            fontFamily: 'var(--font-sans)',
            padding: '4px 0',
          }}
        >
          See full nutrition breakdown →
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Today's workout</div>
        {data?.workouts?.length === 0 ? (
          <div className={styles.workoutCard}>
            <div>
              <div className={styles.workoutLabel}>No workout logged</div>
              <div className={styles.workoutName}>Rest day</div>
            </div>
            <button className={styles.workoutButton} onClick={() => navigate('/workouts')}>
              Log workout
            </button>
          </div>
        ) : (
          data.workouts.map(workout => (
            <div key={workout.id} className={styles.workoutCard} style={{ display: 'block' }}>
              <div className={styles.workoutLabel}>
                {workout.duration_minutes ? `${workout.duration_minutes} min` : 'Workout'}
              </div>
              <div className={styles.workoutName}>{workout.notes || 'Workout logged'}</div>
              <div className={styles.workoutMeta}>{workout.set_count} sets logged</div>
              {data.prs_today?.length > 0 && (
                <div className={styles.prBadge}>PR earned</div>
              )}
            </div>
          ))
        )}
      </div>

      <nav className={styles.bottomNav}>
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <button key={label} className={styles.navItem} onClick={() => navigate(path)}>
              <Icon size={20} color={active ? 'var(--primary)' : 'var(--muted)'} />
              <span className={styles.navLabel} style={{ color: active ? 'var(--primary)' : 'var(--muted)' }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      {cutscene && <CutsceneModal cutscene={cutscene} onDismiss={() => handleDismissCutscene(cutscene)} />}
    </div>
  )
}