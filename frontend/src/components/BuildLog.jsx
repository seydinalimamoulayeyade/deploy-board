import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'

/**
 * Affichage formaté des logs de build (Req 11.1-11.6)
 * - Numéros de ligne
 * - Recherche par mot-clé
 * - Surlignage des erreurs/avertissements
 * - Copie dans le presse-papier
 */
const ERROR_RE = /\b(error|erreur|failed|échec|exception|fatal)\b/i
const WARN_RE = /\b(warn|warning|avertissement|deprecated)\b/i

const lineClass = (line) => {
  if (ERROR_RE.test(line)) return 'bg-red-950/40 text-red-300'
  if (WARN_RE.test(line)) return 'bg-amber-950/40 text-amber-300'
  return 'text-gray-300'
}

const BuildLog = ({ lines = [], pagination, onPageChange }) => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return lines.map((text, i) => ({ text, n: i + 1 }))
    const q = search.toLowerCase()
    return lines
      .map((text, i) => ({ text, n: i + 1 }))
      .filter((l) => l.text.toLowerCase().includes(q))
  }, [lines, search])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('Log copié dans le presse-papier')
    } catch {
      toast.error('Échec de la copie')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans le log..."
          className="flex-1 px-3 py-1.5 border border-gh-border bg-gh-canvas text-gh-fg rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gh-accent placeholder:text-gh-fg-subtle"
        />
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 border border-gh-border bg-gh-subtle text-gh-fg text-sm rounded-md hover:bg-gh-elevated whitespace-nowrap"
        >
          Copier
        </button>
      </div>

      <div className="bg-gh-inset border border-gh-border rounded-md p-4 overflow-auto max-h-[500px] font-mono text-xs">
        {filtered.length === 0 ? (
          <p className="text-gh-fg-subtle">Aucune ligne correspondante</p>
        ) : (
          filtered.map((l) => (
            <div key={l.n} className={`flex ${lineClass(l.text)}`}>
              <span className="select-none text-gh-fg-subtle w-12 flex-shrink-0 text-right pr-3">{l.n}</span>
              <span className="whitespace-pre-wrap break-all">{l.text}</span>
            </div>
          ))
        )}
      </div>

      {/* Pagination (Req 3.6) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            disabled={pagination.currentPage <= 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
            className="px-3 py-1 border border-gh-border rounded text-gh-fg disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-gh-fg-muted">
            Page {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => onPageChange(pagination.currentPage + 1)}
            className="px-3 py-1 border border-gh-border rounded text-gh-fg disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}

export default BuildLog
