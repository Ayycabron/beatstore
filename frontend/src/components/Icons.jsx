const base = (size) => ({ width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false })

export const Play = ({ size = 16 }) => (
  <svg {...base(size)} fill="currentColor"><path d="M7 4.6v14.8a1 1 0 0 0 1.53.85l11.7-7.4a1 1 0 0 0 0-1.7L8.53 3.75A1 1 0 0 0 7 4.6Z" /></svg>
)
export const Pause = ({ size = 16 }) => (
  <svg {...base(size)} fill="currentColor"><rect x="5.5" y="4" width="4.5" height="16" rx="1.4" /><rect x="14" y="4" width="4.5" height="16" rx="1.4" /></svg>
)
export const Next = ({ size = 16 }) => (
  <svg {...base(size)} fill="currentColor"><path d="M5 5.7v12.6a1 1 0 0 0 1.55.83l9.2-6.3a1 1 0 0 0 0-1.66l-9.2-6.3A1 1 0 0 0 5 5.7Z" /><rect x="17" y="5" width="2.6" height="14" rx="1.1" /></svg>
)
export const Prev = ({ size = 16 }) => (
  <svg {...base(size)} fill="currentColor" style={{ transform: 'scaleX(-1)' }}><path d="M5 5.7v12.6a1 1 0 0 0 1.55.83l9.2-6.3a1 1 0 0 0 0-1.66l-9.2-6.3A1 1 0 0 0 5 5.7Z" /><rect x="17" y="5" width="2.6" height="14" rx="1.1" /></svg>
)
export const Volume = ({ size = 16, muted }) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
    {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
  </svg>
)
const Stroke = ({ size = 16, d, w = 2 }) => (
  <svg {...base(size)} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)
export const Search = (p) => <Stroke {...p} d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
export const Arrow = (p) => <Stroke {...p} d="M5 12h14m-6-6 6 6-6 6" />
export const ArrowDown = (p) => <Stroke {...p} d="M12 5v14m-6-6 6 6 6-6" />
export const Check = (p) => <Stroke {...p} w={2.4} d="m5 12.5 4.5 4.5L19 7.5" />
export const Minus = (p) => <Stroke {...p} d="M6 12h12" />
export const Close = (p) => <Stroke {...p} d="M6 6l12 12M18 6 6 18" />
export const Mail = (p) => <Stroke {...p} d="M3 7l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
export const Download = (p) => <Stroke {...p} d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
export const Plus = (p) => <Stroke {...p} d="M12 5v14M5 12h14" />
export const Star = ({ size = 12 }) => (
  <svg {...base(size)} fill="currentColor"><path d="M12 2.5 14.6 9.4 22 12l-7.4 2.6L12 21.5l-2.6-6.9L2 12l7.4-2.6Z" /></svg>
)
