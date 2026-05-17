import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

interface NavbarProps {
  active?: 'dashboard' | 'record' | 'chat'
}

export default function Navbar({ active }: NavbarProps) {
  const links = [
    { href: '/dashboard', label: 'Meetings',    key: 'dashboard' },
    { href: '/record',    label: '+ New',       key: 'record'    },
    { href: '/chat',      label: 'Ask AI',      key: 'chat'      },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050816]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            🧠
          </div>
          <span className="text-lg font-bold font-[var(--font-syne)] gradient-text">BriefBuddy</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.key} href={l.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                active === l.key
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
              {l.label}
            </Link>
          ))}
          <div className="ml-3">
            <UserButton afterSignOutUrl="/" appearance={{
              elements: {
                avatarBox: 'w-8 h-8 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-[#050816]'
              }
            }} />
          </div>
        </div>
      </div>
    </nav>
  )
}