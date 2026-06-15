import { formatDistanceToNow, format } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Couleurs et libellés des statuts de build (français)
 */
export const STATUS_CONFIG = {
  SUCCESS:  { label: 'Réussi',     bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500' },
  FAILED:   { label: 'Échoué',     bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500' },
  RUNNING:  { label: 'En cours',   bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500' },
  ABORTED:  { label: 'Annulé',     bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-500' },
  UNKNOWN:  { label: 'Inconnu',    bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400' },
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
