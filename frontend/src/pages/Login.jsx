import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Auth.module.css'

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    {!open && <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>}
  </svg>
)

export default function Login() {
  const { login }           = useAuth()
  const navigate            = useNavigate()
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, pass)
      navigate('/')
    } catch (err) {
      // humanise common backend errors
      const msg = err.message.toLowerCase()
      if (msg.includes('incorrect') || msg.includes('unauthorized') || msg.includes('401')) {
        setError('incorrect email or password')
      } else if (msg.includes('not found') || msg.includes('no user')) {
        setError('no account found with that email')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.wordmark}>tailor</div>
        <p className={styles.tagline}>made with love, for you</p>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.fields}>

          <div className="input-wrap">
            <label className="input-label">email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-wrap">
            <label className="input-label">password</label>
            <div className={styles.inputRow}>
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={`btn btn-primary btn-full ${styles.submitBtn}`}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'sign in'}
        </button>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>forgot password?</Link>
          <span className={styles.linkDivider}>·</span>
          <Link to="/register" className={styles.link}>create account</Link>
        </div>
      </form>

      <div className={styles.decoration}>
        <span className={styles.decorLine} />
        <span className={styles.decorText}>♡</span>
        <span className={styles.decorLine} />
      </div>
    </div>
  )
}
