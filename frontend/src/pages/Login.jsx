import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!email || !password) {
      setError('All fields are required')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
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
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
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
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 24 }}>
          <a href="/forgot-password" style={{ fontSize: 12, color: '#C4714A', textDecoration: 'none' }}>
            Forgot password?
          </a>
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
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#A07B5C' }}>
          Don't have an account?{' '}
          <a href="/register" style={{ color: '#C4714A', textDecoration: 'none' }}>Register</a>
        </p>
      </div>
    </div>
  )
}