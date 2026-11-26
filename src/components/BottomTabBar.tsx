import React from 'react'
import { NavLink } from 'react-router-dom'
import { Sunrise, Layers, Wind, User } from 'lucide-react'

interface NavTab {
  to: string
  label: string
  icon: React.ElementType
}

const TABS: NavTab[] = [
  { to: '/today', label: 'Today', icon: Sunrise },
  { to: '/programs', label: 'Programs', icon: Layers },
  { to: '/breathwork', label: 'Breathwork', icon: Wind },
  { to: '/profile', label: 'Profile', icon: User },
]

export const BottomTabBar: React.FC = () => {
  return (
    <nav
      aria-label="App Navigation"
      className="sticky bottom-0 z-30 w-full bg-[#0B1117]/90 backdrop-blur-md border-t border-[#1E293B] px-3 py-2"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 min-w-[64px] min-h-[48px] rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1B2] ${
                  isActive ? 'text-[#00D1B2] font-semibold' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="w-5 h-5 transition-transform duration-150 active:scale-95" />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00D1B2]" />
                    )}
                  </div>
                  <span className="text-[11px] tracking-tight mt-1">{tab.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
