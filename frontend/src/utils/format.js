import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Couleurs et libellés des statuts de build (français)
 */
export const STATUS_CONFIG = {
  SUCCESS:  { label: 'Réussi',   pill: 'bg-gh-success-subtle text-gh-success-fg',   dot: 'bg-gh-success-emphasis' },
  FAILED:   { label: 'Échoué',   pill: 'bg-gh-danger-subtle text-gh-danger-fg',     dot: 'bg-gh-danger-fg' },
  RUNNING:  { label: 'En cours', pill: 'bg-gh-attention-subtle text-gh-attention-fg', dot: 'bg-gh-attention-fg' },
  ABORTED:  { label: 'Annulé',   pill: 'bg-gh-inset text-gh-fg-muted',               dot: 'bg-gh-fg-subtle' },
  UNKNOWN:  { label: 'Inconnu',  pill: 'bg-gh-inset text-gh-fg-muted',               dot: 'bg-gh-fg-subtle' },
}

export const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.UNKNOWN

/**
 * Formate une durée en millisecondes vers un format lisible
 */
export const formatDuration = (ms) => {
  if (!ms && ms !== 0) return 'N/A'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Formate une date ISO en temps relatif (ex: "il y a 5 minutes")
 */
export const formatRelative = (iso) => {
  if (!iso) return 'N/A'
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr })
  } catch {
    return 'N/A'
  }
}

/**
 * Formate une date ISO en date complète
 */
export const formatDate = (iso) => {
  if (!iso) return 'N/A'
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch {
    return 'N/A'
  }
}

/**
 * Formate une taille en octets vers Ko/Mo
 */
export const formatSize = (bytes) => {
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
