import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getPRs, getExerciseHistory, logWeight, getRecommendations } from '../api/progress'
import BottomNav from '../components/BottomNav'
import PageHeader from '../components/PageHeader'
import SectionLabel from '../components/SectionLabel'
import Card from '../components/Card'
import LoadingScreen from '../components/LoadingScreen'
import EmptyState from '../components/EmptyState'
import styles from '../styles/Progress.module.css'

const today = () => new Date().toISOString().split('T')[0]

export default function Progress() {
  const navigate = useNavigate()
  const [prs, setPrs] = useState([])
  const [selectedPR, setSelectedPR] = useState(null)
  const [history, setHistory] = useState(null)
  const [recommendations, setRecommendations] = useState(null)
  const [weight, setWeight] = useState('')
  const [logging, setLogging] = useState(false)
  const [weightLogged, setWeightLogged] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPRs(), getRecommendations()])
      .then(([prsRes, recRes]) => { setPrs(prsRes.data); setRecommendations(recRes.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSelectPR = async (pr) => {
    if (selectedPR?.exercise === pr.exercise) { setSelectedPR(null); setHistory(null); return }
    setSelectedPR(pr)
    try {
      const res = await getExerciseHistory(pr.exercise_id || 1)
      setHistory(res.data)
    } catch (err) { console.error(err) }
  }

  const handleLogWeight = async () => {
    if (!weight) return
    setLogging(true)
    try {
      await logWeight({ weight_kg: parseFloat(weight), date: today() })
      setWeightLogged(true)
      setWeight('')
      const recRes = await getRecommendations()
      setRecommendations(recRes.data)
      setTimeout(() => setWeightLogged(false), 3000)
    } catch (err) { console.error(err) }
    finally { setLogging(false) }
  }

  const chartData = history?.history?.map(h => ({ date: h.date.slice(5), weight: h.weight_kg, reps: h.reps })) || []

  if (loading) return <LoadingScreen />

  return (
    <div className={styles.page}>
      <PageHeader title="Progress" backTo="/" />

      <div className={styles.section}>
        <SectionLabel>Weight</SectionLabel>
        <div className={styles.weightSection}>
          <div className={styles.weightRow}>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Today's weight (kg)" className={styles.weightInput} />
            <button className={styles.logWeightButton} onClick={handleLogWeight} disabled={logging}>
              {logging ? 'Saving...' : weightLogged ? 'Saved!' : 'Log weight'}
            </button>
          </div>
        </div>
      </div>

      {recommendations && (
        <div className={styles.section}>
          <SectionLabel>Calorie targets</SectionLabel>
          <div className={styles.trendCard}>
            {[
              { label: 'BMR', value: `${recommendations.bmr} kcal` },
              { label: 'Estimated TDEE', value: `${recommendations.estimated_tdee} kcal` },
              { label: 'Calorie target', value: `${recommendations.calorie_target} kcal` },
              { label: 'Protein target', value: `${recommendations.protein_target_g}g` },
              { label: 'Weight trend', value: recommendations.weight_trend_kg_per_week != null ? `${recommendations.weight_trend_kg_per_week > 0 ? '+' : ''}${recommendations.weight_trend_kg_per_week} kg/week` : 'Need more data' },
              { label: 'Data points', value: `${recommendations.data_points} weigh-ins` },
            ].map(({ label, value }) => (
              <div key={label} className={styles.trendRow}>
                <span className={styles.trendLabel}>{label}</span>
                <span className={styles.trendValue}>{value}</span>
              </div>
            ))}
            {recommendations.note && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>{recommendations.note}</p>}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <SectionLabel>Personal records</SectionLabel>
        {prs.length === 0 ? (
          <EmptyState>No PRs yet — log a workout to get started</EmptyState>
        ) : (
          <div className={styles.prGrid}>
            {prs.map((pr, i) => (
              <div key={i}>
                <div
                  className={`${styles.prCard} ${selectedPR?.exercise === pr.exercise ? styles.active : ''}`}
                  onClick={() => handleSelectPR({ ...pr, exercise_id: i + 1 })}
                >
                  <div className={styles.prLeft}>
                    <div className={styles.prName}>{pr.exercise}</div>
                    <div className={styles.prMuscle}>{pr.muscle_group}</div>
                  </div>
                  <div className={styles.prRight}>
                    <div className={styles.prWeight}>{pr.weight_kg}kg</div>
                    <div className={styles.prReps}>{pr.reps} reps</div>
                    <div className={styles.prDate}>{pr.achieved_at}</div>
                  </div>
                </div>

                {selectedPR?.exercise === pr.exercise && history && (
                  <div className={styles.chartCard}>
                    <div className={styles.chartTitle}>
                      {pr.exercise}
                      {history.yoy_percent != null && (
                        <span className={`${styles.yoyBadge} ${history.yoy_percent >= 0 ? styles.yoyPositive : styles.yoyNegative}`}>
                          {history.yoy_percent >= 0 ? '+' : ''}{history.yoy_percent}% YoY
                        </span>
                      )}
                    </div>
                    <div className={styles.chartMeta}>
                      {history.data_points} sessions · PR: {history.pr?.weight_kg}kg × {history.pr?.reps} reps
                    </div>
                    {chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8B4BC" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6E4555' }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: '#6E4555' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ background: '#FFF0F3', border: '0.5px solid #E8B4BC', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-sans)' }} formatter={(value) => [`${value}kg`, 'Weight']} />
                          <Line type="monotone" dataKey="weight" stroke="#D282A6" strokeWidth={2} dot={{ fill: '#D282A6', r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className={styles.noData}>Log more sessions to see your progress chart</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}