import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGreeting } from '../hooks/useGreeting'
import { api } from '../api/client'
import BottomNav from '../components/BottomNav'
import styles from '../styles/Dashboard.module.css'

const today = () => new Date().toISOString().slice(0, 10)

function CalorieRing({ consumed, goal }) {
  if (!goal) return null
  const pct    = Math.min(consumed / goal, 1)
  const r      = 34
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const over   = consumed > goal
  const left   = Math.max(goal - consumed, 0)

  return (
    <div className={styles.ringWrap}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--bg-raised)" strokeWidth="7"/>
        <circle
          cx="40" cy="40" r={r}
          fill="none"
          stroke={over ? 'var(--danger)' : 'var(--pink)'}
          strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s var(--ease)' }}
        />
      </svg>
      <div className={styles.ringCenter}>
        <span className={styles.ringNum} style={{ color: over ? 'var(--danger)' : 'var(--pink)' }}>
          {over ? `+${Math.round(consumed - goal)}` : Math.round(left)}
        </span>
        <span className={styles.ringLbl}>{over ? 'over' : 'kcal left'}</span>
      </div>
    </div>
  )
}

function MacroBar({ label, value, goal, color }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  return (
    <div className={styles.macroRow}>
      <span className={styles.macroLabel}>{label}</span>
      <div className="bar-bg" style={{ flex: 1 }}>
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.macroVal}>{Math.round(value)}g</span>
    </div>
  )
}

function WeekStreak({ workoutsThisWeek = [] }) {
  const days    = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <div className={styles.streakSection}>
      <span className={styles.streakLabel}>
        this week · {workoutsThisWeek.length} workout{workoutsThisWeek.length !== 1 ? 's' : ''}
      </span>
      <div className={styles.streakDots}>
        {days.map((d, i) => {
          const isToday = i === todayIdx
          const isDone  = workoutsThisWeek.includes(i)
          return (
            <div key={i} className={`${styles.sDot} ${isDone ? styles.done : isToday ? styles.today : styles.empty}`}>
              <span className={styles.sDotLetter}>{d}</span>
              <div className={styles.sDotPip} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WorkoutCard({ lastWorkout, latestPr, workoutsThisWeek }) {
  const navigate = useNavigate()

  if (!lastWorkout) {
    return (
      <div className={`card ${styles.workoutCard}`}>
        <div className={styles.workoutHeader}>
          <div className={styles.cardTag}>workouts</div>
          <div className={styles.emptyWorkout}>
            <p>no workouts logged yet</p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/log-workout')}>
              log your first
            </button>
          </div>
        </div>
      </div>
    )
  }

  const daysAgo = lastWorkout.days_ago === 0
    ? 'today'
    : lastWorkout.days_ago === 1
    ? 'yesterday'
    : `${lastWorkout.days_ago} days ago`

  return (
    <div className={`card ${styles.workoutCard}`}>
      <div className={styles.workoutHeader}>
        <div className={styles.cardTag}>last workout</div>
        <div className={styles.workoutName}>{lastWorkout.notes || 'Workout'}</div>
        <div className={styles.workoutMeta}>
          {daysAgo}
          {lastWorkout.duration_minutes ? ` · ${lastWorkout.duration_minutes} min` : ''}
          {lastWorkout.set_count ? ` · ${lastWorkout.set_count} sets` : ''}
        </div>
      </div>

      {latestPr && (
        <div className={styles.prRibbon}>
          <div className={styles.trophyBg}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L9.6 6H14L10.5 8.5L11.8 13L8 10.5L4.2 13L5.5 8.5L2 6H6.4L8 2Z" fill="var(--brown)"/>
            </svg>
          </div>
          <div className={styles.prInfo}>
            <span className={styles.prLabel}>latest pr</span>
            <span className={styles.prVal}>
              {latestPr.exercise_name} · {Math.round(latestPr.weight_kg * 2.205)} lbs × {latestPr.reps}
            </span>
          </div>
          {latestPr.is_new && <span className="pill pill-olive">NEW</span>}
        </div>
      )}

      <WeekStreak workoutsThisWeek={workoutsThisWeek} />
    </div>
  )
}

export default function Dashboard() {
  const { user }                  = useAuth()
  console.log('user object:', user)
  const greeting                  = useGreeting(user?.username || '')
  const navigate                  = useNavigate()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    api.get(`/dashboard/${today()}`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const profile          = data?.profile
  const totals           = data?.food?.totals
  const calorieGoal      = profile?.calorie_goal
  const proteinGoal      = profile?.protein_goal
  const carbsGoal        = profile?.carbs_goal
  const fatGoal          = profile?.fat_goal
  const lastWorkout      = data?.last_workout
  const latestPr         = data?.latest_pr
  const workoutsThisWeek = data?.workouts_this_week || []

  const subheading = (() => {
    const h = new Date().getHours()
    if (h < 12) return "let's make today great"
    if (h < 17) return "keeping it up today?"
    if (h < 21) return "how's the day been?"
    return "still going strong"
  })()

  if (loading) return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div className="page">
      <header className={styles.header}>
        <div className={styles.headerBg}>
          <div className={styles.greeting}>{greeting}</div>
          <div className={styles.subheading}>{subheading}</div>
        </div>
        <svg className={styles.wave} viewBox="0 0 390 20" preserveAspectRatio="none">
          <path d="M0 8 Q49 0 98 8 Q147 16 196 8 Q245 0 294 8 Q343 16 390 8 L390 20 L0 20 Z" fill="var(--bg)"/>
        </svg>
      </header>

      <div className="page-content" style={{ paddingTop: 8 }}>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

        {/* calories + macros — only show if profile has goals set */}
        {calorieGoal ? (
          <div className={`card card-pad animate-fade-up ${styles.calCard}`}>
            <div className={styles.calTop}>
              <CalorieRing consumed={totals?.calories || 0} goal={calorieGoal} />
              <div className={styles.macros}>
                <MacroBar label="protein" value={totals?.protein || 0} goal={proteinGoal} color="var(--pink)" />
                <MacroBar label="carbs"   value={totals?.carbs   || 0} goal={carbsGoal}   color="var(--brown-light)" />
                <MacroBar label="fat"     value={totals?.fat     || 0} goal={fatGoal}     color="var(--cream-dark)" />
              </div>
            </div>
            <hr className="divider" style={{ margin: '12px 0' }} />
            <div className={styles.calFooter}>
              <div className={styles.calStat}>
                <span className={styles.calStatNum} style={{ color: 'var(--pink)' }}>
                  {Math.round(totals?.calories || 0)}
                </span>
                <span className={styles.calStatLbl}>consumed</span>
              </div>
              <div className={styles.calDivider} />
              <div className={styles.calStat}>
                <span className={styles.calStatNum}>{Math.round(calorieGoal)}</span>
                <span className={styles.calStatLbl}>goal</span>
              </div>
              <div className={styles.calDivider} />
              <div className={styles.calStat}>
                <span className={styles.calStatNum} style={{ color: 'var(--olive-light)' }}>
                  {Math.round(totals?.protein || 0)}g
                </span>
                <span className={styles.calStatLbl}>protein</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={`card card-pad animate-fade-up ${styles.setupPrompt}`}>
            <p className={styles.setupText}>set up your nutrition goals to see your daily progress</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/profile')}>
              set up profile
            </button>
          </div>
        )}

        {/* workout card */}
        <div className="animate-fade-up delay-2">
          <WorkoutCard
            lastWorkout={lastWorkout}
            latestPr={latestPr}
            workoutsThisWeek={workoutsThisWeek}
          />
        </div>

        {/* action buttons */}
        <div className={`${styles.btns} animate-fade-up delay-3`}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/food')}>
            + log food
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/log-workout')}>
            + log workout
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
