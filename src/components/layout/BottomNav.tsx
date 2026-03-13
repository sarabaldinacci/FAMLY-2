'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-zinc-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/pantry',
    label: 'Dispensa',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-zinc-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 0v14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v14M9 11h6" />
      </svg>
    ),
  },
  {
    href: '/planner',
    label: 'Planner',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-zinc-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Imposta',
    icon: (active: boolean) => (
      <svg className={`w-5 h-5 ${active ? 'text-amber-400' : 'text-zinc-500'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur border-t border-zinc-800 safe-bottom"
         style={{ maxWidth: '512px', margin: '0 auto' }}>
      <div className="flex">
        {TABS.map(tab => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 active:opacity-70 transition-opacity">
              {tab.icon(active)}
              <span className={`text-[10px] font-medium ${active ? 'text-amber-400' : 'text-zinc-500'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
