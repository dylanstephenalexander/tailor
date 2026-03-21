import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import client from '../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email || !username || !password || !confirmPassword) {
      setError('All fields are required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return false
    }
    if (username.length < 2) {
      setError('Username must be at least 2 characters')
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
      await client.post('/auth/register', { email, username, password })
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || 'Registration failed')
      } else {
        setError(detail || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    paddingRight: 44,
    borderRadius: 12,
    border: '0.5px solid #EDD5C0',
    background: '#FAF6F1',
    fontSize: 14,
    color: '#2C1A0E',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  }

  const labelStyle = {
    fontSize: 12,
    color: '#A07B5C',
    display: 'block',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  const eyeButtonStyle = {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#A07B5C',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF6F1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: '#FFF8F3',
        border: '0.5px solid #EDD5C0',
        borderRadius: 24,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 380,
      }}>
        <h1 style={{
          fontFamily: "'Lora', serif",
          fontSize: 32,
          fontWeight: 400,
          color: '#2C1A0E',
          marginBottom: 4,
        }}>Tailor</h1>
        <p style={{ color: '#A07B5C', fontSize: 14, marginBottom: 32 }}>fitted to you</p>

        {error && (
          <div style={{
            background: '#FAECE7',
            color: '#993C1D',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 16,
            border: '0.5px solid #F0997B',
          }}>{error}</div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={{ ...inputStyle, paddingRight: 14 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="yourname"
            style={{ ...inputStyle, paddingRight: 14 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters, 1 number"
              style={inputStyle}
            />
            <button onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Confirm password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              style={inputStyle}
            />
            <button onClick={() => setShowConfirm(!showConfirm)} style={eyeButtonStyle}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#A07B5C' : '#2C1A0E',
            color: '#FAF6F1',
            border: 'none',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#A07B5C' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#C4714A', textDecoration: 'none' }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}