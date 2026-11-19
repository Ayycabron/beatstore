import { useInView } from '../lib/hooks.js'

/** Fait apparaître son contenu en fondu quand il entre à l'écran. */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView({ rootMargin: '0px 0px -10% 0px' })
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'is-in' : ''} ${className}`} style={{ '--delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}
