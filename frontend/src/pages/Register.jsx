import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import styles from '../styles/Auth.module.css'

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1 9s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    {!open && <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>}
  </svg>
)

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 7l3.5 3.5L11 3" stroke="var(--olive-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M3 3l7 7M10 3l-7 7" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [
    { label: 'at least 8 characters', pass: password.length >= 8 },
    { label: 'contains a number',     pass: /\d/.test(password) },
  ]
  return (
    <div className={styles.checks}>
      {checks.map(c => (
        <div key={c.label} className={`${styles.check} ${c.pass ? styles.checkPass : styles.checkFail}`}>
          {c.pass ? <CheckIcon /> : <XIcon />}
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

function AsyncAdorn({ status }) {
  if (!status) return null
  if (status === 'checking')  return <span className={styles.inputAdorn}><span className="spinner" style={{width:14,height:14}}/></span>
  if (status === 'available') return <span className={styles.inputAdorn}><CheckIcon /></span>
  if (status === 'taken')     return <span className={styles.inputAdorn}><XIcon /></span>
  return null
}

function useAvailability(value, minLength, endpoint) {
  const [status, setStatus] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    if (value.length < minLength) { setStatus(null); return }
    setStatus('checking')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        await api.get(`${endpoint}${encodeURIComponent(value)}`)
        setStatus('available')
      } catch {
        setStatus('taken')
      }
    }, 500)
    return () => clearTimeout(timer.current)
  }, [value, minLength, endpoint])

  return status
}

export default function Register() {
  const { login }                     = useAuth()
  const navigate                      = useNavigate()
  const [email, setEmail]             = useState('')
  const [username, setUsername]       = useState('')
  const [pass, setPass]               = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const isEmailFormat = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // only check email availability once it looks like a valid email
  const emailToCheck    = isEmailFormat && email.length > 0 ? email : ''
  const emailStatus     = useAvailability(emailToCheck,    5, '/auth/check-email?email=')
  const usernameStatus  = useAvailability(username,        2, '/auth/check-username?username=')

  const passValid    = pass.length === 0    || (pass.length >= 8 && /\d/.test(pass))
  const confirmMatch = confirm.length === 0 || pass === confirm

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !isEmailFormat)       return setError('please enter a valid email.')
    if (emailStatus === 'taken')        return setError('that email is already registered.')
    if (usernameStatus === 'taken')     return setError('that username is already taken.')
    if (!pass || !passValid)            return setError('password must be at least 8 characters and include a number.')
    if (pass !== confirm)               return setError('passwords do not match.')
    setLoading(true)
    try {
      await api.post('/auth/register', { email, username, password: pass })
      await login(email, pass)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.wordmark}>tailor</div>
        <p className={styles.tagline}>let's get you set up</p>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.fields}>

          <div className="input-wrap">
            <label className="input-label">email</label>
            <div className={styles.inputRow}>
              <input
                className={`input ${!isEmailFormat || emailStatus === 'taken' ? styles.inputError : emailStatus === 'available' ? styles.inputSuccess : ''}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <AsyncAdorn status={emailStatus} />
            </div>
            {!isEmailFormat             && <span className={styles.fieldError}>that doesn't look like a valid email</span>}
            {emailStatus === 'taken'    && <span className={styles.fieldError}>email already registered</span>}
            {emailStatus === 'available'&& <span className={styles.fieldSuccess}>looks good!</span>}
          </div>

          <div className="input-wrap">
            <label className="input-label">username</label>
            <div className={styles.inputRow}>
              <input
                className={`input ${usernameStatus === 'taken' ? styles.inputError : usernameStatus === 'available' ? styles.inputSuccess : ''}`}
                type="text"
                placeholder="something cute"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <AsyncAdorn status={usernameStatus} />
            </div>
            {usernameStatus === 'available' && <span className={styles.fieldSuccess}>username available!</span>}
            {usernameStatus === 'taken'     && <span className={styles.fieldError}>username already taken</span>}
          </div>

          <div className="input-wrap">
            <label className="input-label">password</label>
            <div className={styles.inputRow}>
              <input
                className={`input ${pass && !passValid ? styles.inputError : ''}`}
                type={showPass ? 'text' : 'password'}
                placeholder="at least 8 chars, 1 number"
                value={pass}
                onChange={e => setPass(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                <EyeIcon open={showPass} />
              </button>
            </div>
            <PasswordStrength password={pass} />
          </div>

          <div className="input-wrap">
            <label className="input-label">confirm password</label>
            <div className={styles.inputRow}>
              <input
                className={`input ${confirm && !confirmMatch ? styles.inputError : confirm && confirmMatch ? styles.inputSuccess : ''}`}
                type={showConfirm ? 'text' : 'password'}
                placeholder="same as above"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirm && !confirmMatch && <span className={styles.fieldError}>passwords don't match</span>}
            {confirm &&  confirmMatch && <span className={styles.fieldSuccess}>looks good!</span>}
          </div>

        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={`btn btn-primary btn-full ${styles.submitBtn}`}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'create account'}
        </button>

        <div className={styles.links}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>already have an account?</span>
          <Link to="/login" className={styles.link}>sign in</Link>
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
