import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Dumbbell, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getProfile, createProfile, updateProfile, logWeight } from '../api/profile'
import styles from '../styles/Profile.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function Profile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [weight, setWeight] = useState('')

  const [form, setForm] = useState({
    height_cm: '',
    weight_kg: '',
    age: '',
    sex: 'female',
    goal: 'maintain',
    target_weekly_change_kg: 0,
    birthday: '',
    oura_token: '',
  })

  useEffect(() => {
    getProfile()
      .then(res => {
        setProfile(res.data)
        setForm({
          height_cm: res.data.height_cm || '',
          weight_kg: res.data.weight_kg || '',
          age: res.data.age || '',
          sex: res.data.sex || 'female',
          goal: res.data.goal || 'maintain',
          target_weekly_change_kg: res.data.target_weekly_change_kg || 0,
          birthday: res.data.birthday || '',
          oura_token: res.data.oura_token || '',
        })
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      const data = {
        ...form,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        age: form.age ? parseInt(form.age) : null,
        target_weekly_change_kg: parseFloat(form.target_weekly_change_kg),
      }
      if (profile) {
        await updateProfile(data)
      } else {
        await createProfile(data)
      }
      if (form.weight_kg) {
        await logWeight({ weight_kg: parseFloat(form.weight_kg), date: today() })
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Food', path: '/food', icon: Search },
    { label: 'Workouts', path: '/workouts', icon: Dumbbell },
    { label: 'Profile', path: '/profile', icon: User },
  ]

  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontFamily: 'var(--font-sans)' }}>Loading...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <button className={styles.logoutButton} onClick={() => { logout(); navigate('/login') }}>
          Sign out
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Body stats</div>
        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Height (cm)</label>
              <input
                type="number"
                value={form.height_cm}
                onChange={e => update('height_cm', e.target.value)}
                placeholder="165"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Weight (kg)</label>
              <input
                type="number"
                value={form.weight_kg}
                onChange={e => update('weight_kg', e.target.value)}
                placeholder="65"
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => update('age', e.target.value)}
                placeholder="25"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Sex</label>
              <select className={styles.select} value={form.sex} onChange={e => update('sex', e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>
          <div className={styles.fieldLast}>
            <label className={styles.label}>Birthday</label>
            <input
              type="date"
              value={form.birthday}
              onChange={e => update('birthday', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Goal</div>
        <div className={styles.card}>
          <div className={styles.field}>
            <label className={styles.label}>I want to</label>
            <select className={styles.select} value={form.goal} onChange={e => update('goal', e.target.value)}>
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain weight</option>
              <option value="gain">Gain muscle</option>
            </select>
          </div>
          {form.goal !== 'maintain' && (
            <div className={styles.fieldLast}>
              <label className={styles.label}>
                {form.goal === 'lose' ? 'Lose' : 'Gain'} per week (kg)
              </label>
              <select
                className={styles.select}
                value={form.target_weekly_change_kg}
                onChange={e => update('target_weekly_change_kg', e.target.value)}
              >
                <option value={0.25}>0.25 kg / week</option>
                <option value={0.5}>0.5 kg / week</option>
                <option value={0.75}>0.75 kg / week</option>
                <option value={1.0}>1.0 kg / week</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Oura Ring</div>
        <div className={styles.card}>
          {form.oura_token ? (
            <div className={styles.field}>
              <div className={styles.ouraConnected}>
                <div className={styles.ouraConnectedDot} />
                Oura connected
              </div>
            </div>
          ) : null}
          <div className={styles.fieldLast}>
            <label className={styles.label}>Personal access token</label>
            <input
              type="password"
              value={form.oura_token}
              onChange={e => update('oura_token', e.target.value)}
              placeholder="Paste your Oura token here"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
        {success && <div className={styles.success}>Profile saved</div>}
      </div>

      <nav className={styles.bottomNav ?? ''} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg)', borderTop: '0.5px solid var(--border)',
        display: 'flex', justifyContent: 'space-around', padding: '12px 0 24px',
      }}>
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <Icon size={20} color={active ? 'var(--primary)' : 'var(--muted)'} />
              <span style={{ fontSize: 10, color: active ? 'var(--primary)' : 'var(--muted)', fontFamily: 'var(--font-sans)', letterSpacing: '0.03em' }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}