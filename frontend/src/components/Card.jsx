import styles from '../styles/Card.module.css'

export default function Card({ children, onClick, active }) {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}