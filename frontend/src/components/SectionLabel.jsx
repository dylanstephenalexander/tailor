import styles from '../styles/SectionLabel.module.css'

export default function SectionLabel({ children }) {
  return <div className={styles.label}>{children}</div>
}