import { Text } from '@radix-ui/themes'
import { HomeIcon, DashboardIcon, GearIcon, CounterClockwiseClockIcon } from '@radix-ui/react-icons'
import { useNavigate, useLocation } from 'react-router-dom'

export function NavBar({ mini = false }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const active = pathname === '/' ? 'home'
    : pathname.startsWith('/category') ? 'categories'
    : pathname.startsWith('/utilities') ? 'utilities'
    : pathname.startsWith('/reorder') ? 'reorder'
    : 'home'

  const items = [
    { icon: HomeIcon, label: 'Home', key: 'home', go: () => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }) } },
    { icon: DashboardIcon, label: 'Categories', key: 'categories', go: () => navigate('/category/All') },
    { icon: GearIcon, label: 'Utilities', key: 'utilities', go: () => navigate('/utilities') },
    { icon: CounterClockwiseClockIcon, label: 'Reorder', key: 'reorder', go: () => navigate('/reorder') },
  ]

  return (
    <div className={`navbar ${mini ? 'mini' : ''}`}>
      {items.map((it) => {
        const Icon = it.icon
        const on = active === it.key
        return (
          <div key={it.label} className={`nav-item ${on ? 'active' : ''}`} onClick={it.go}>
            <span className="nav-icw"><Icon width={20} height={20} /></span>
            <Text size="1" weight={on ? 'bold' : 'medium'} className="nav-lb">{it.label}</Text>
          </div>
        )
      })}
    </div>
  )
}
