import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Dumbbell, User } from 'lucide-react'
import styles from './BottomNav.module.css'

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Food', path: '/food', icon: Search },
  { label: 'Workouts', path: '/workouts', icon: Dumbbell },
  { label: 'Profile', path: '/profile', icon: User },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className={styles.nav}>
      {navItems.map(({ label, path, icon: Icon }) => {
        const active = location.pathname === path
        return (
          <button
            key={label}
            className={styles.item}
            onClick={() => navigate(path)}
          >
            <Icon size={20} color={active ? 'var(--primary)' : 'var(--muted)'} />
            <span className={styles.label} style={{ color: active ? 'var(--primary)' : 'var(--muted)' }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}