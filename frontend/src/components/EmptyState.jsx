import styles from '../styles/EmptyState.module.css'

export default function EmptyState({ children }) {
  return <div className={styles.empty}>{children}</div>
}