import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, X } from 'lucide-react'
import { searchFood, logFood } from '../api/nutrition'
import styles from '../styles/Food.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

const today = () => new Date().toISOString().split('T')[0]

export default function Food() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ personal: [], usda: [] })
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [servings, setServings] = useState(1)
  const [mealType, setMealType] = useState('breakfast')
  const [logging, setLogging] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults({ personal: [], usda: [] })
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchFood(query)
        setResults(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 500)
  }, [query])

  const handleLog = async () => {
    if (!selected) return
    setLogging(true)
    try {
      await logFood({
        food_data: selected.id ? null : selected,
        food_item_id: selected.id || null,
        date: today(),
        meal_type: mealType,
        servings: parseFloat(servings),
      })
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setLogging(false)
    }
  }

  const allResults = [...(results.personal || []), ...(results.usda || [])]

  const calcMacros = (food, s) => ({
    calories: Math.round((food.calories || 0) * s),
    protein: Math.round((food.protein || 0) * s),
    carbs: Math.round((food.carbs || 0) * s),
    fat: Math.round((food.fat || 0) * s),
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Log food</h1>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search foods..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className={styles.clearButton} onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className={styles.mealTypeRow}>
          {MEAL_TYPES.map(type => (
            <button
              key={type}
              className={`${styles.mealTypeButton} ${mealType === type ? styles.active : ''}`}
              onClick={() => setMealType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.resultsSection}>
        {loading && <div className={styles.loadingState}>Searching...</div>}

        {!loading && query && allResults.length === 0 && (
          <div className={styles.emptyState}>No results for "{query}"</div>
        )}

        {!loading && !query && (
          <div className={styles.emptyState}>Search for a food to get started</div>
        )}

        {allResults.length > 0 && (
          <>
            {results.personal?.length > 0 && (
              <>
                <div className={styles.sectionLabel}>Your foods</div>
                <div className={styles.resultsList}>
                  {results.personal.map((food, i) => (
                    <div key={i} className={styles.resultRow} onClick={() => { setSelected(food); setServings(1) }}>
                      <div>
                        <div className={styles.resultName}>{food.name}</div>
                        <div className={styles.resultMacros}>
                          P {Math.round(food.protein)}g · C {Math.round(food.carbs)}g · F {Math.round(food.fat)}g
                        </div>
                      </div>
                      <div className={styles.resultCal}>{Math.round(food.calories)} kcal</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {results.usda?.length > 0 && (
              <>
                <div className={styles.sectionLabel} style={{ marginTop: results.personal?.length > 0 ? 16 : 0 }}>
                  USDA database
                </div>
                <div className={styles.resultsList}>
                  {results.usda.map((food, i) => (
                    <div key={i} className={styles.resultRow} onClick={() => { setSelected(food); setServings(1) }}>
                      <div>
                        <div className={styles.resultName}>{food.name}</div>
                        <div className={styles.resultMacros}>
                          P {Math.round(food.protein)}g · C {Math.round(food.carbs)}g · F {Math.round(food.fat)}g
                        </div>
                      </div>
                      <div className={styles.resultCal}>{Math.round(food.calories)} kcal</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>{selected.name}</div>
            <div className={styles.modalMacros}>per 100g · USDA</div>

            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>Servings (100g each)</span>
              <input
                type="number"
                className={styles.servingsInput}
                value={servings}
                min={0.1}
                step={0.5}
                onChange={e => setServings(e.target.value)}
              />
            </div>

            <div className={styles.modalRow}>
              <span className={styles.modalLabel}>Meal</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {MEAL_TYPES.map(type => (
                  <button
                    key={type}
                    className={`${styles.mealTypeButton} ${mealType === type ? styles.active : ''}`}
                    onClick={() => setMealType(type)}
                    style={{ fontSize: 11, padding: '4px 10px' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const m = calcMacros(selected, parseFloat(servings) || 1)
              return (
                <div className={styles.modalMacroGrid}>
                  {[
                    { label: 'Calories', value: m.calories },
                    { label: 'Protein', value: `${m.protein}g` },
                    { label: 'Carbs', value: `${m.carbs}g` },
                    { label: 'Fat', value: `${m.fat}g` },
                  ].map(({ label, value }) => (
                    <div key={label} className={styles.modalMacroItem}>
                      <div className={styles.modalMacroValue}>{value}</div>
                      <div className={styles.modalMacroLabel}>{label}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            <button className={styles.confirmButton} onClick={handleLog} disabled={logging}>
              {logging ? 'Logging...' : `Add to ${mealType}`}
            </button>
            <button className={styles.cancelButton} onClick={() => setSelected(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}