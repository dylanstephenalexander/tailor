import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import BottomNav from '../components/BottomNav'
import styles from '../styles/Food.module.css'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

const MICRO_GROUPS = [
  {
    label: 'minerals',
    fields: [
      { key: 'sodium',     label: 'sodium',     unit: 'mg' },
      { key: 'potassium',  label: 'potassium',  unit: 'mg' },
      { key: 'calcium',    label: 'calcium',    unit: 'mg' },
      { key: 'iron',       label: 'iron',       unit: 'mg' },
      { key: 'magnesium',  label: 'magnesium',  unit: 'mg' },
      { key: 'zinc',       label: 'zinc',       unit: 'mg' },
      { key: 'phosphorus', label: 'phosphorus', unit: 'mg' },
      { key: 'selenium',   label: 'selenium',   unit: 'mcg' },
      { key: 'copper',     label: 'copper',     unit: 'mg' },
      { key: 'manganese',  label: 'manganese',  unit: 'mg' },
      { key: 'chromium',   label: 'chromium',   unit: 'mcg' },
      { key: 'iodine',     label: 'iodine',     unit: 'mcg' },
    ],
  },
  {
    label: 'vitamins',
    fields: [
      { key: 'vitamin_a',        label: 'vitamin A',         unit: 'mcg' },
      { key: 'vitamin_c',        label: 'vitamin C',         unit: 'mg' },
      { key: 'vitamin_d',        label: 'vitamin D',         unit: 'mcg' },
      { key: 'vitamin_e',        label: 'vitamin E',         unit: 'mg' },
      { key: 'vitamin_k',        label: 'vitamin K',         unit: 'mcg' },
      { key: 'vitamin_b6',       label: 'vitamin B6',        unit: 'mg' },
      { key: 'vitamin_b12',      label: 'vitamin B12',       unit: 'mcg' },
      { key: 'folate',           label: 'folate',            unit: 'mcg' },
      { key: 'thiamin',          label: 'thiamin (B1)',      unit: 'mg' },
      { key: 'riboflavin',       label: 'riboflavin (B2)',   unit: 'mg' },
      { key: 'niacin',           label: 'niacin (B3)',       unit: 'mg' },
      { key: 'pantothenic_acid', label: 'pantothenic acid',  unit: 'mg' },
      { key: 'biotin',           label: 'biotin',            unit: 'mcg' },
      { key: 'choline',          label: 'choline',           unit: 'mg' },
    ],
  },
  {
    label: 'fats',
    fields: [
      { key: 'fiber',              label: 'fiber',             unit: 'g' },
      { key: 'sugar',              label: 'sugar',             unit: 'g' },
      { key: 'saturated_fat',      label: 'saturated fat',     unit: 'g' },
      { key: 'trans_fat',          label: 'trans fat',         unit: 'g' },
      { key: 'cholesterol',        label: 'cholesterol',       unit: 'mg' },
      { key: 'polyunsaturated_fat',label: 'polyunsaturated',   unit: 'g' },
      { key: 'monounsaturated_fat',label: 'monounsaturated',   unit: 'g' },
      { key: 'omega_3',            label: 'omega-3',           unit: 'g' },
      { key: 'omega_6',            label: 'omega-6',           unit: 'g' },
      { key: 'omega_9',            label: 'omega-9',           unit: 'g' },
    ],
  },
]

function fuzzyScore(query, str) {
  const q = query.toLowerCase()
  const s = str.toLowerCase()
  if (s === q) return 100
  if (s.startsWith(q)) return 90
  if (s.includes(q)) return 80 - (s.indexOf(q) * 0.1)
  let qi = 0, score = 0
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) { score += 1; qi++ }
  }
  return qi === q.length ? (score / s.length) * 60 : 0
}

function rankResults(query, personal, usda) {
  return [
    ...personal.map(f => ({ ...f, _source: 'personal' })),
    ...usda.map(f => ({ ...f, _source: 'usda' })),
  ]
    .map(f => ({ ...f, _score: fuzzyScore(query, f.name) + (f._source === 'personal' ? 20 : 0) }))
    .filter(f => f._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 12)
}

function NutritionPreview({ food, amount, unit }) {
  if (!food || !amount) return null
  const factor = unit === 'g'
    ? Number(amount) / 100
    : (food.unit_size_g || 100) * Number(amount) / 100
  const n = v => Math.round((v || 0) * factor)
  return (
    <div className={styles.preview}>
      <div className={styles.previewMain}>
        <span className={styles.previewCal}>{n(food.calories)}</span>
        <span className={styles.previewCalLbl}>kcal</span>
      </div>
      <div className={styles.previewMacros}>
        <div className={styles.previewMacro}>
          <span style={{ color: 'var(--pink)' }}>{n(food.protein)}g</span>
          <span>protein</span>
        </div>
        <div className={styles.previewMacro}>
          <span style={{ color: 'var(--brown-light)' }}>{n(food.carbs)}g</span>
          <span>carbs</span>
        </div>
        <div className={styles.previewMacro}>
          <span style={{ color: 'var(--cream-dark)' }}>{n(food.fat)}g</span>
          <span>fat</span>
        </div>
      </div>
    </div>
  )
}

function CreateFoodModal({ onClose, onCreated }) {
  const [step, setStep]               = useState(1)
  const [createdFood, setCreatedFood] = useState(null)
  const [name, setName]               = useState('')
  const [calories, setCalories]       = useState('')
  const [protein, setProtein]         = useState('')
  const [carbs, setCarbs]             = useState('')
  const [fat, setFat]                 = useState('')
  const [servingLabel, setServingLabel] = useState('')
  const [unitSizeG, setUnitSizeG]     = useState('')
  const [micros, setMicros]           = useState({})
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const setMicro = (key, val) => setMicros(m => ({ ...m, [key]: val }))

  const saveBasic = async () => {
    if (!name.trim()) return setError('name is required')
    if (!calories)    return setError('calories are required')
    setSaving(true)
    setError('')
    try {
      const food = await api.post('/nutrition/food', {
        name: name.trim(),
        calories: Number(calories),
        protein:  Number(protein)  || 0,
        carbs:    Number(carbs)    || 0,
        fat:      Number(fat)      || 0,
        serving_label: servingLabel || null,
        unit_size_g:   unitSizeG ? Number(unitSizeG) : null,
      })
      setCreatedFood(food)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const saveMicros = async () => {
    if (!createdFood) return
    setSaving(true)
    setError('')
    try {
      const payload = {}
      Object.entries(micros).forEach(([k, v]) => { if (v) payload[k] = Number(v) })
      await api.patch(`/nutrition/food/${createdFood.id}/micros`, payload)
      onCreated({ ...createdFood, ...payload })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const skipMicros = () => onCreated(createdFood)

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.modalTitle}>
              {step === 1 ? 'create food' : 'add micronutrients'}
            </span>
            <div className={styles.modalSteps}>
              <div className={`${styles.modalStep} ${step >= 1 ? styles.modalStepActive : ''}`} />
              <div className={`${styles.modalStep} ${step >= 2 ? styles.modalStepActive : ''}`} />
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {step === 1 && (
            <>
              <div className="input-wrap">
                <label className="input-label">name</label>
                <input className="input" placeholder="e.g. chicken breast" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>

              <div className={styles.modalRow}>
                <div className="input-wrap" style={{ flex: 1 }}>
                  <label className="input-label">calories (per 100g)</label>
                  <input className="input" type="number" placeholder="165" value={calories} onChange={e => setCalories(e.target.value)} />
                </div>
                <div className="input-wrap" style={{ flex: 1 }}>
                  <label className="input-label">protein (g)</label>
                  <input className="input" type="number" placeholder="31" value={protein} onChange={e => setProtein(e.target.value)} />
                </div>
              </div>

              <div className={styles.modalRow}>
                <div className="input-wrap" style={{ flex: 1 }}>
                  <label className="input-label">carbs (g)</label>
                  <input className="input" type="number" placeholder="0" value={carbs} onChange={e => setCarbs(e.target.value)} />
                </div>
                <div className="input-wrap" style={{ flex: 1 }}>
                  <label className="input-wrap">fat (g)</label>
                  <input className="input" type="number" placeholder="3.6" value={fat} onChange={e => setFat(e.target.value)} />
                </div>
              </div>

              <div className={styles.sectionDivider}>serving size (optional)</div>

              <div className={styles.modalRow}>
                <div className="input-wrap" style={{ flex: 1 }}>
                  <label className="input-label">serving label</label>
                  <input className="input" placeholder="e.g. 1 egg" value={servingLabel} onChange={e => setServingLabel(e.target.value)} />
                </div>
                <div className="input-wrap" style={{ flex: 1 }}>
                  <label className="input-label">serving size (g)</label>
                  <input className="input" type="number" placeholder="50" value={unitSizeG} onChange={e => setUnitSizeG(e.target.value)} />
                </div>
              </div>

              {error && <p className={styles.modalError}>{error}</p>}

              <button className="btn btn-primary btn-full" onClick={saveBasic} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'save & continue →'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p className={styles.microsHint}>
                all values are per 100g. fill in what you know — you can always skip this.
              </p>

              {MICRO_GROUPS.map(group => (
                <div key={group.label} className={styles.microGroup}>
                  <div className={styles.sectionDivider}>{group.label}</div>
                  <div className={styles.microGrid}>
                    {group.fields.map(f => (
                      <div key={f.key} className="input-wrap">
                        <label className="input-label">{f.label} <span className={styles.microUnit}>{f.unit}</span></label>
                        <input
                          className="input"
                          type="number"
                          placeholder="0"
                          value={micros[f.key] || ''}
                          onChange={e => setMicro(f.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {error && <p className={styles.modalError}>{error}</p>}

              <div className={styles.modalRow}>
                <button className="btn btn-ghost btn-full" onClick={skipMicros}>skip for now</button>
                <button className="btn btn-primary btn-full" onClick={saveMicros} disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'save micros'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Food() {
  const navigate                    = useNavigate()
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [searching, setSearching]   = useState(false)
  const [selected, setSelected]     = useState(null)
  const [amount, setAmount]         = useState('')
  const [unit, setUnit]             = useState('g')
  const [mealType, setMealType]     = useState(() => {
    const h = new Date().getHours()
    if (h < 11) return 'breakfast'
    if (h < 14) return 'lunch'
    if (h < 20) return 'dinner'
    return 'snack'
  })
  const [logging, setLogging]       = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [scanning, setScanning]     = useState(false)
  const [error, setError]           = useState('')
  const searchTimer                 = useRef(null)

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const data = await api.get(`/nutrition/search?q=${encodeURIComponent(q)}`)
      setResults(rankResults(q, data.personal || [], data.usda || []))
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => search(query), 350)
    return () => clearTimeout(searchTimer.current)
  }, [query, search])

  const selectFood = (food) => {
    setSelected(food)
    setQuery(food.name)
    setResults([])
    setAmount('')
    setUnit(food.unit_size_g ? 'serving' : 'g')
  }

  const logFood = async () => {
    if (!selected || !amount || Number(amount) <= 0) return
    setError('')
    setLogging(true)
    const servings = unit === 'g'
      ? Number(amount) / 100
      : (selected.unit_size_g * Number(amount)) / 100
    try {
      await api.post('/log/', {
        food_item_id: selected.id,
        date: new Date().toISOString().slice(0, 10),
        meal_type: mealType,
        servings,
      })
      navigate('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLogging(false)
    }
  }

  const scanBarcode = async () => {
    if (!('BarcodeDetector' in window)) {
      const code = prompt('enter barcode number:')
      if (!code) return
      await lookupBarcode(code)
      return
    }
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const video  = document.createElement('video')
      video.srcObject = stream
      await video.play()
      const canvas = document.createElement('canvas')
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      stream.getTracks().forEach(t => t.stop())
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
      const barcodes = await detector.detect(canvas)
      if (barcodes.length > 0) {
        await lookupBarcode(barcodes[0].rawValue)
      } else {
        setError('no barcode detected — try again')
      }
    } catch {
      setError('camera access denied or unavailable')
    } finally {
      setScanning(false)
    }
  }

  const lookupBarcode = async (code) => {
    try {
      const data = await api.get(`/nutrition/barcode/${code}`)
      if (data.food) selectFood(data.food)
    } catch {
      setError('product not found in database')
    }
  }

  const hasServing = selected?.unit_size_g && selected?.serving_label

  return (
    <div className="page">
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className={styles.title}>log food</h1>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>+ create</button>
      </div>

      <div className="page-content" style={{ paddingTop: 8 }}>
        <div className={styles.mealRow}>
          {MEAL_TYPES.map(m => (
            <button
              key={m}
              className={`${styles.mealBtn} ${mealType === m ? styles.mealBtnActive : ''}`}
              onClick={() => setMealType(m)}
            >{m}</button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <div className={styles.searchRow}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.searchIcon}>
              <circle cx="7" cy="7" r="4.5" stroke="var(--text-muted)" strokeWidth="1.3"/>
              <path d="M10.5 10.5L13 13" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="search foods..."
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null) }}
              autoFocus
            />
            {searching && <span className="spinner" style={{ width: 14, height: 14, flexShrink: 0 }} />}
            <button className={styles.barcodeBtn} onClick={scanBarcode} disabled={scanning}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2"  y="4" width="2" height="10" rx="0.5" fill="currentColor"/>
                <rect x="5"  y="4" width="1" height="10" rx="0.5" fill="currentColor"/>
                <rect x="7"  y="4" width="2" height="10" rx="0.5" fill="currentColor"/>
                <rect x="10" y="4" width="1" height="10" rx="0.5" fill="currentColor"/>
                <rect x="12" y="4" width="2" height="10" rx="0.5" fill="currentColor"/>
                <rect x="15" y="4" width="1" height="10" rx="0.5" fill="currentColor"/>
              </svg>
            </button>
          </div>

          {results.length > 0 && !selected && (
            <div className={styles.results}>
              {results.map((food, i) => (
                <button key={i} className={styles.resultItem} onClick={() => selectFood(food)}>
                  <div className={styles.resultName}>{food.name}</div>
                  <div className={styles.resultMeta}>
                    {food._source === 'personal' && <span className={styles.personalBadge}>mine</span>}
                    <span>{Math.round(food.calories)} kcal · {Math.round(food.protein)}g protein</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className={`card card-pad ${styles.entryCard} animate-scale-in`}>
            <div className={styles.entryName}>{selected.name}</div>

            <div className={styles.unitToggle}>
              <button
                className={`${styles.unitBtn} ${unit === 'g' ? styles.unitBtnActive : ''}`}
                onClick={() => setUnit('g')}
              >grams</button>
              {hasServing && (
                <button
                  className={`${styles.unitBtn} ${unit === 'serving' ? styles.unitBtnActive : ''}`}
                  onClick={() => setUnit('serving')}
                >{selected.serving_label}</button>
              )}
            </div>

            <div className={styles.amountRow}>
              <input
                className={`input ${styles.amountInput}`}
                type="number"
                placeholder={unit === 'g' ? '100' : '1'}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
              />
              <span className={styles.amountUnit}>
                {unit === 'g' ? 'g' : selected.serving_label || 'serving'}
              </span>
            </div>

            <NutritionPreview food={selected} amount={amount} unit={unit} />

            {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

            <button
              className="btn btn-primary btn-full"
              onClick={logFood}
              disabled={logging || !amount || Number(amount) <= 0}
              style={{ marginTop: 8 }}
            >
              {logging ? <span className="spinner" style={{ width: 14, height: 14 }} /> : `add to ${mealType}`}
            </button>
          </div>
        )}

        {!selected && !query && (
          <div className="empty-state">
            <p className={styles.emptyHint}>search for a food above, scan a barcode, or create your own</p>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateFoodModal
          onClose={() => setShowCreate(false)}
          onCreated={(food) => { setShowCreate(false); selectFood(food) }}
        />
      )}

      <BottomNav />
    </div>
  )
}
