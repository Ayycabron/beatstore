import { useSyncExternalStore } from 'react'

const subscribe = (cb) => {
  window.addEventListener('popstate', cb)
  return () => window.removeEventListener('popstate', cb)
}

export function usePath() {
  const path = useSyncExternalStore(subscribe, () => window.location.pathname)
  return path.replace(/\/+$/, '') || '/'
}

export function navigate(to) {
  const url = new URL(to, window.location.origin)
  const samePage = url.pathname === window.location.pathname
  if (!samePage) {
    window.history.pushState({}, '', url.pathname + url.hash)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  const target = url.hash && document.getElementById(url.hash.slice(1))
  if (target) target.scrollIntoView({ behavior: 'smooth' })
  else if (!samePage) window.scrollTo({ top: 0 })
  // l'ancre peut ne pas exister avant le rendu de la nouvelle page
  if (url.hash && !target) setTimeout(() => document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60)
}

export function Link({ to, children, onClick, ...rest }) {
  return (
    <a
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
