import { NavLink } from 'react-router-dom'
import styles from '../styles/BottomNav.module.css'

const tabs = [
  {
    path: '/',
    label: 'home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="11" width="5" height="9" rx="1.5" fill={active ? 'var(--pink)' : 'var(--text-faint)'} />
        <rect x="8.5" y="7" width="5" height="13" rx="1.5" fill={active ? 'var(--pink)' : 'var(--text-faint)'} opacity={active ? 0.7 : 1} />
        <rect x="15" y="3" width="5" height="17" rx="1.5" fill={active ? 'var(--pink)' : 'var(--text-faint)'} opacity={active ? 0.4 : 1} />
      </svg>
    ),
  },
  {
    path: '/nutrition',
    label: 'nutrition',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M11 3C11 3 6 7 6 12a5 5 0 0010 0c0-5-5-9-5-9z"
          stroke={active ? 'var(--pink)' : 'var(--text-faint)'}
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M11 15v-4"
          stroke={active ? 'var(--pink)' : 'var(--text-faint)'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    path: '/workouts',
    label: 'workouts',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 15l5-6 4 4 7-9"
          stroke={active ? 'var(--pink)' : 'var(--text-faint)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11" cy="8" r="3.5"
          stroke={active ? 'var(--pink)' : 'var(--text-faint)'}
          strokeWidth="1.5"
        />
        <path
          d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7"
          stroke={active ? 'var(--pink)' : 'var(--text-faint)'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {tabs.map(({ path, label, icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <span className={styles.icon}>{icon(isActive)}</span>
              <span className={styles.label}>{label}</span>
              {isActive && <span className={styles.pip} />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
