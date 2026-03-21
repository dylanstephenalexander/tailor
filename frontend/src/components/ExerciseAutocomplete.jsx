import { useState, useEffect, useRef } from 'react'
import { searchExercises } from '../api/workouts'
import styles from '../styles/ExerciseAutocomplete.module.css'

export default function ExerciseAutocomplete({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim() || query === value) {
      setResults([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchExercises(query)
        setResults(res.data)
        setOpen(true)
      } catch (err) {
        console.error(err)
      }
    }, 300)
  }, [query])

  const handleSelect = (exercise) => {
    setQuery(exercise.name)
    onChange(exercise)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => query && results.length > 0 && setOpen(true)}
        placeholder={placeholder || 'Search exercises...'}
        style={{
          border: 'none',
          background: 'none',
          fontSize: 18,
          fontFamily: 'var(--font-serif)',
          color: 'var(--dark)',
          outline: 'none',
          padding: 0,
          width: '100%',
        }}
      />
      {open && results.length > 0 && (
        <div className={styles.dropdown}>
          {results.map(ex => (
            <div
              key={ex.id}
              className={styles.option}
              onMouseDown={() => handleSelect(ex)}
            >
              <span className={styles.optionName}>{ex.name}</span>
              <span className={styles.optionMuscle}>{ex.muscle_group}</span>
            </div>
          ))}
          {results.length === 0 && query.length > 1 && (
            <div
              className={styles.option}
              onMouseDown={() => handleSelect({ name: query, muscle_group: 'other', id: null })}
            >
              <span className={styles.optionName}>Add "{query}"</span>
              <span className={styles.optionMuscle}>custom</span>
            </div>
          )}
        </div>
      )}
      {open && results.length === 0 && query.length > 2 && (
        <div className={styles.dropdown}>
          <div
            className={styles.option}
            onMouseDown={() => handleSelect({ name: query, muscle_group: 'other', id: null })}
          >
            <span className={styles.optionName}>Add "{query}"</span>
            <span className={styles.optionMuscle}>custom</span>
          </div>
        </div>
      )}
    </div>
  )
}