import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import client from '../api/client'
import styles from '../styles/Auth.module.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    if (!password || !confirmPassword) {
      setError('All fields are required')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      await client.post('/auth/reset-password', { token, new_password: password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired reset link')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.logo}>Tailor</h1>
          <div className={styles.error}>Invalid reset link</div>
          <p className={styles.footer}>
            <Link to="/forgot-password" className={styles.link}>Request a new one</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Tailor</h1>
        <p className={styles.tagline}>choose a new password</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label}>New password</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters, 1 number"
              style={{ paddingRight: 44 }}
            />
            <button className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className={styles.fieldLast}>
          <label className={styles.label}>Confirm password</label>
          <div className={styles.inputWrapper}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              style={{ paddingRight: 44 }}
            />
            <button className={styles.eyeButton} onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset password'}
        </button>

        <p className={styles.footer}>
          <Link to="/login" className={styles.link}>Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
