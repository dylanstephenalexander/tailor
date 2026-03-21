import { useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import styles from '../styles/Auth.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!email) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    try {
      await client.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Tailor</h1>
        <p className={styles.tagline}>fitted to you</p>

        {submitted ? (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <p style={{ fontSize: 14, color: 'var(--dark)', marginBottom: 8 }}>Check your inbox</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                If that email exists you'll receive a reset link shortly.
              </p>
            </div>
            <p className={styles.footer}>
              <Link to="/login" className={styles.link}>Back to sign in</Link>
            </p>
          </>
        ) : (
          <>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>

            <div className={styles.fieldLast}>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>

            <p className={styles.footer}>
              <Link to="/login" className={styles.link}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}