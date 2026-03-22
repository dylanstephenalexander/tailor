import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import BottomNav from '../components/BottomNav'
import styles from '../styles/Profile.module.css'

const GOALS = [
  { value: 'maintain',     label: 'maintain weight',  icon: '⚖' },
  { value: 'lose_weight',  label: 'lose weight',      icon: '↓' },
  { value: 'gain_weight',  label: 'gain weight',      icon: '↑' },
]

const RATE_OPTIONS = [0.25, 0.5, 0.75, 1.0]

function kgToLbs(kg) { return kg ? Math.round(kg * 2.205 * 10) / 10 : '' }
function lbsToKg(lbs) { return lbs ? Math.round(lbs / 2.205 * 100) / 100 : null }
function cmToFtIn(cm) {
  if (!cm) return { ft: '', in: '' }
  const totalIn = cm / 2.54
  return { ft: Math.floor(totalIn / 12), in: Math.round(totalIn % 12) }
}
function ftInToCm(ft, inches) {
  if (!ft && !inches) return null
  return Math.round(((Number(ft) * 12) + Number(inches)) * 2.54)
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  // form fields
  const [weightLbs, setWeightLbs]   = useState('')
  const [heightFt, setHeightFt]     = useState('')
  const [heightIn, setHeightIn]     = useState('')
  const [birthday, setBirthday]     = useState('')
  const [sex, setSex]               = useState('')
  const [goal, setGoal]             = useState('maintain')
  const [ratePerWeek, setRatePerWeek] = useState(0.5)
  const [calorieGoal, setCalorieGoal] = useState('')
  const [proteinGoal, setProteinGoal] = useState('')
  const [carbsGoal, setCarbsGoal]     = useState('')
  const [fatGoal, setFatGoal]         = useState('')
  const [ouraToken, setOuraToken]     = useState('')

  useEffect(() => {
    api.get('/profile/')
      .then(p => {
        setProfile(p)
        if (p.weight_kg)  setWeightLbs(kgToLbs(p.weight_kg))
        const { ft, in: inches } = cmToFtIn(p.height_cm)
        if (ft)           setHeightFt(ft)
        if (inches !== '') setHeightIn(inches)
        if (p.birthday)   setBirthday(p.birthday)
        if (p.sex)        setSex(p.sex)
        if (p.goal)       setGoal(p.goal)
        if (p.target_weekly_change_kg) setRatePerWeek(p.target_weekly_change_kg * 2.205)
        if (p.calorie_goal) setCalorieGoal(p.calorie_goal)
        if (p.protein_goal) setProteinGoal(p.protein_goal)
        if (p.carbs_goal)   setCarbsGoal(p.carbs_goal)
        if (p.fat_goal)     setFatGoal(p.fat_goal)
        if (p.oura_token)   setOuraToken(p.oura_token)
      })
      .catch(() => {}) // 404 = no profile yet, that's fine
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setError('')
    setSaving(true)
    const payload = {
      weight_kg:               lbsToKg(weightLbs),
      height_cm:               ftInToCm(heightFt, heightIn),
      birthday:                birthday || null,
      sex:                     sex || null,
      goal,
      target_weekly_change_kg: goal === 'maintain' ? 0 : lbsToKg(ratePerWeek),
      calorie_goal:            calorieGoal ? Number(calorieGoal) : null,
      protein_goal:            proteinGoal ? Number(proteinGoal) : null,
      carbs_goal:              carbsGoal   ? Number(carbsGoal)   : null,
      fat_goal:                fatGoal     ? Number(fatGoal)     : null,
      oura_token:              ouraToken   || null,
    }
    try {
      if (profile) {
        await api.put('/profile/', payload)
      } else {
        await api.post('/profile/', payload)
      }
      setProfile(payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div className="page">
      <div className={styles.headerRow}>
        <h1 className="page-header-title" style={{ padding: 'var(--space-5) var(--space-4) var(--space-3)' }}>profile</h1>
        <button
          className={`btn btn-sm ${saved ? styles.savedBtn : 'btn-primary'}`}
          onClick={save}
          disabled={saving}
          style={{ marginRight: 'var(--space-4)' }}
        >
          {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : saved ? 'saved ✓' : 'save'}
        </button>
      </div>

      <div className="page-content" style={{ paddingTop: 0 }}>
        {error && <p className={styles.error}>{error}</p>}

        {/* body */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>body</div>
          <div className={`card card-pad ${styles.sectionCard}`}>

            <div className={styles.row}>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">weight (lbs)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="145"
                  value={weightLbs}
                  onChange={e => setWeightLbs(e.target.value)}
                />
              </div>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">sex</label>
                <div className={styles.segmented}>
                  {['male', 'female'].map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.segment} ${sex === s ? styles.segmentActive : ''}`}
                      onClick={() => setSex(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">height</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="input"
                      type="number"
                      placeholder="5"
                      value={heightFt}
                      onChange={e => setHeightFt(e.target.value)}
                      style={{ paddingRight: 28 }}
                    />
                    <span className={styles.inputUnit}>ft</span>
                  </div>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      className="input"
                      type="number"
                      placeholder="7"
                      value={heightIn}
                      onChange={e => setHeightIn(e.target.value)}
                      style={{ paddingRight: 28 }}
                    />
                    <span className={styles.inputUnit}>in</span>
                  </div>
                </div>
              </div>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">birthday</label>
                <input
                  className="input"
                  type="text"
                  placeholder="yyyy-mm-dd"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                />
              </div>
            </div>

          </div>
        </section>

        {/* goal */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>goal</div>
          <div className={`card card-pad ${styles.sectionCard}`}>
            <div className={styles.goalGrid}>
              {GOALS.map(g => (
                <button
                  key={g.value}
                  type="button"
                  className={`${styles.goalBtn} ${goal === g.value ? styles.goalBtnActive : ''}`}
                  onClick={() => setGoal(g.value)}
                >
                  <span className={styles.goalIcon}>{g.icon}</span>
                  <span className={styles.goalLabel}>{g.label}</span>
                </button>
              ))}
            </div>

            {goal !== 'maintain' && (
              <div style={{ marginTop: 16 }}>
                <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>
                  {goal === 'lose_weight' ? 'lose' : 'gain'} per week (lbs)
                </label>
                <div className={styles.rateRow}>
                  {RATE_OPTIONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      className={`${styles.rateBtn} ${ratePerWeek === r ? styles.rateBtnActive : ''}`}
                      onClick={() => setRatePerWeek(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* nutrition goals */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>nutrition goals</div>
          <div className={`card card-pad ${styles.sectionCard}`}>
            <p className={styles.sectionHint}>
              set these manually — they drive your dashboard progress rings.
              the linear regression adjuster will tune your calorie goal over time.
            </p>

            <div className={styles.row}>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">calories</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="number"
                    placeholder="2400"
                    value={calorieGoal}
                    onChange={e => setCalorieGoal(e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <span className={styles.inputUnit}>kcal</span>
                </div>
              </div>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">protein</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="number"
                    placeholder="160"
                    value={proteinGoal}
                    onChange={e => setProteinGoal(e.target.value)}
                    style={{ paddingRight: 28 }}
                  />
                  <span className={styles.inputUnit}>g</span>
                </div>
              </div>
            </div>

            <div className={styles.row}>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">carbs</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="number"
                    placeholder="250"
                    value={carbsGoal}
                    onChange={e => setCarbsGoal(e.target.value)}
                    style={{ paddingRight: 28 }}
                  />
                  <span className={styles.inputUnit}>g</span>
                </div>
              </div>
              <div className="input-wrap" style={{ flex: 1 }}>
                <label className="input-label">fat</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="number"
                    placeholder="80"
                    value={fatGoal}
                    onChange={e => setFatGoal(e.target.value)}
                    style={{ paddingRight: 28 }}
                  />
                  <span className={styles.inputUnit}>g</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* oura */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>integrations</div>
          <div className={`card card-pad ${styles.sectionCard}`}>
            <div className="input-wrap">
              <label className="input-label">oura personal access token</label>
              <input
                className="input"
                type="password"
                placeholder="optional — unlocks sleep + steps"
                value={ouraToken}
                onChange={e => setOuraToken(e.target.value)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                if left blank, sleep and steps won't appear on your dashboard. no pressure.
              </span>
            </div>
          </div>
        </section>

        {/* account */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>account</div>
          <div className={`card card-pad ${styles.sectionCard}`}>
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>username</span>
              <span className={styles.accountVal}>{user?.username}</span>
            </div>
            <div className={styles.accountRow}>
              <span className={styles.accountLabel}>email</span>
              <span className={styles.accountVal}>{user?.email}</span>
            </div>
          </div>
        </section>

        <div style={{ height: 'var(--space-4)' }} />
      </div>

      <BottomNav />
    </div>
  )
}
