import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import styles from '../styles/PageHeader.module.css'

export default function PageHeader({ title, backTo, action }) {
  const navigate = useNavigate()

  return (
    <div className={styles.header}>
      {backTo !== undefined && (
        <button className={styles.backButton} onClick={() => navigate(backTo || -1)}>
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}