import type { ElementType } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, Compass, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavTab {
  to: string
  label: string
  icon: ElementType
  end?: boolean
}

const TABS: NavTab[] = [
  { to: '/', label: 'Coach', icon: Activity, end: true },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomTabBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="sticky bottom-0 z-30 w-full border-t border-border bg-background px-3 py-2"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
