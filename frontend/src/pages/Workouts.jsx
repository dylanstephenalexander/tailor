import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Plus } from 'lucide-react'
import { logWorkout } from '../api/workouts'
import ExerciseAutocomplete from '../components/ExerciseAutocomplete'
import styles from '../styles/Workouts.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function Workouts() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('')
  const [exercises, setExercises] = useState([
    { name: '', muscle_group: 'other', sets: [] }
  ])
  const [loading, setLoading] = useState(false)
  const [prsEarned, setPrsEarned] = useState(null)

  const addExercise = () => {
    setExercises([...exercises, { name: '', muscle_group: 'other', sets: [] }])
  }

  const removeExercise = (i) => {
    setExercises(exercises.filter((_, idx) => idx !== i))
  }

  const updateExercise = (i, field, value) => {
    const updated = [...exercises]
    updated[i][field] = value
    setExercises(updated)
  }

  const addSet = (exerciseIdx) => {
    const updated = [...exercises]
    const prev = updated[exerciseIdx].sets
    const lastSet = prev[prev.length - 1]
    updated[exerciseIdx].sets.push({
      set_number: prev.length + 1,
      reps: lastSet?.reps || 8,
      weight_kg: lastSet?.weight_kg || 0,
      rpe: lastSet?.rpe || null,
    })
    setExercises(updated)
  }

  const removeSet = (exerciseIdx, setIdx) => {
    const updated = [...exercises]
    updated[exerciseIdx].sets = updated[exerciseIdx].sets
      .filter((_, i) => i !== setIdx)
      .map((s, i) => ({ ...s, set_number: i + 1 }))
    setExercises(updated)
  }

  const updateSet = (exerciseIdx, setIdx, field, value) => {
    const updated = [...exercises]
    updated[exerciseIdx].sets[setIdx][field] = value
    setExercises(updated)
  }

  const handleSubmit = async () => {
    const sets = exercises.flatMap(ex =>
      ex.sets.map(s => ({
        exercise_name: ex.name,
        muscle_group: ex.muscle_group,
        set_number: s.set_number,
        reps: parseInt(s.reps),
        weight_kg: parseFloat(s.weight_kg),
        rpe: s.rpe ? parseFloat(s.rpe) : null,
      }))
    ).filter(s => s.exercise_name && s.reps && s.weight_kg)

    if (sets.length === 0) return

    setLoading(true)
    try {
      const res = await logWorkout({
        date: today(),
        notes,
        duration_minutes: duration ? parseInt(duration) : null,
        sets,
      })
      if (res.data.prs_earned?.length > 0) {
        setPrsEarned(res.data.prs_earned)
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (prsEarned) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '80px 0 0' }}>
          <div className={styles.prBanner}>
            <div className={styles.prBannerTitle}>New PR!</div>
            <div className={styles.prBannerSub}>You absolutely crushed it today.</div>
            <div className={styles.prList}>
              {prsEarned.map(pr => <div key={pr}>🏆 {pr}</div>)}
            </div>
          </div>
          <button className={styles.doneButton} onClick={() => navigate('/')}>
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Log workout</h1>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Details</div>
        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Push day, leg day..."
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="60"
              />
            </div>
          </div>
        </div>
      </div>

      {exercises.map((exercise, eIdx) => (
        <div className={styles.section} key={eIdx}>
          <div className={styles.card}>
            <div className={styles.exerciseHeader}>
              <ExerciseAutocomplete
                value={exercise.name}
                onChange={(ex) => {
                  updateExercise(eIdx, 'name', ex.name)
                  updateExercise(eIdx, 'muscle_group', ex.muscle_group)
                }}
                placeholder="Search exercise..."
              />
              <button className={styles.removeExerciseButton} onClick={() => removeExercise(eIdx)}>
                <X size={16} />
              </button>
            </div>

            {exercise.muscle_group && exercise.muscle_group !== 'other' && (
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                {exercise.muscle_group}
              </div>
            )}

            <div className={styles.setsList}>
              {exercise.sets.map((set, sIdx) => (
                <div key={sIdx} className={styles.setRow}>
                  <div>
                    <div className={styles.setInfo}>
                      Set {set.set_number} — {set.weight_kg}kg × {set.reps} reps
                    </div>
                    {set.rpe && <div className={styles.setMeta}>RPE {set.rpe}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      value={set.weight_kg}
                      onChange={e => updateSet(eIdx, sIdx, 'weight_kg', e.target.value)}
                      placeholder="kg"
                      style={{ width: 56, padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', fontSize: 13, textAlign: 'center', outline: 'none', fontFamily: 'var(--font-sans)' }}
                    />
                    <input
                      type="number"
                      value={set.reps}
                      onChange={e => updateSet(eIdx, sIdx, 'reps', e.target.value)}
                      placeholder="reps"
                      style={{ width: 48, padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', fontSize: 13, textAlign: 'center', outline: 'none', fontFamily: 'var(--font-sans)' }}
                    />
                    <button className={styles.deleteButton} onClick={() => removeSet(eIdx, sIdx)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className={styles.addSetButton} onClick={() => addSet(eIdx)}>
              + Add set
            </button>
          </div>
        </div>
      ))}

      <div className={styles.section}>
        <button className={styles.addExerciseButton} onClick={addExercise}>
          <Plus size={16} /> Add exercise
        </button>

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save workout'}
        </button>
      </div>
    </div>
  )
}