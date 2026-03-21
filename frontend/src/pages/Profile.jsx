import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile, createProfile, updateProfile, logWeight } from '../api/profile'
import BottomNav from '../components/BottomNav'
import PageHeader from '../components/PageHeader'
import SectionLabel from '../components/SectionLabel'
import Card from '../components/Card'
import LoadingScreen from '../components/LoadingScreen'
import styles from '../styles/Profile.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function Profile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    height_cm: '', weight_kg: '', age: '', sex: 'female',
    goal: 'maintain', target_weekly_change_kg: 0, birthday: '', oura_token: '',
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
      if (profile) await updateProfile(data)
      else await createProfile(data)
      if (form.weight_kg) await logWeight({ weight_kg: parseFloat(form.weight_kg), date: today() })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  if (loading) return <LoadingScreen />

  return (
    <div className={styles.page}>
      <PageHeader
        title="Profile"
        action={
          <button className={styles.logoutButton} onClick={() => { logout(); navigate('/login') }}>
            Sign out
          </button>
        }
      />

      <div className={styles.section}>
        <SectionLabel>Body stats</SectionLabel>
        <Card>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Height (cm)</label>
              <input type="number" value={form.height_cm} onChange={e => update('height_cm', e.target.value)} placeholder="165" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Weight (kg)</label>
              <input type="number" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} placeholder="65" />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Age</label>
              <input type="number" value={form.age} onChange={e => update('age', e.target.value)} placeholder="25" />
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
            <input type="date" value={form.birthday} onChange={e => update('birthday', e.target.value)} />
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <SectionLabel>Goal</SectionLabel>
        <Card>
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
              <label className={styles.label}>{form.goal === 'lose' ? 'Lose' : 'Gain'} per week (kg)</label>
              <select className={styles.select} value={form.target_weekly_change_kg} onChange={e => update('target_weekly_change_kg', e.target.value)}>
                <option value={0.25}>0.25 kg / week</option>
                <option value={0.5}>0.5 kg / week</option>
                <option value={0.75}>0.75 kg / week</option>
                <option value={1.0}>1.0 kg / week</option>
              </select>
            </div>
          )}
        </Card>
      </div>

      <div className={styles.section}>
        <SectionLabel>Oura Ring</SectionLabel>
        <Card>
          {form.oura_token && (
            <div className={styles.field}>
              <div className={styles.ouraConnected}>
                <div className={styles.ouraConnectedDot} />
                Oura connected
              </div>
            </div>
          )}
          <div className={styles.fieldLast}>
            <label className={styles.label}>Personal access token</label>
            <input type="password" value={form.oura_token} onChange={e => update('oura_token', e.target.value)} placeholder="Paste your Oura token here" />
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save profile'}
        </button>
        {success && <div className={styles.success}>Profile saved</div>}
      </div>

      <BottomNav />
    </div>
  )
}