import { NavLink, Route, Routes } from 'react-router-dom'
import GlobeScene from './components/globe/GlobeScene'
import HikerCard from './components/ui/HikerCard'
import SosAlert from './components/ui/SosAlert'
import ToastContainer from './components/ui/ToastContainer'
import { useUrlState } from './hooks/useUrlState'
import { useCriticalAlerts } from './hooks/useCriticalAlerts'
import { useLiveData } from './hooks/useLiveData'
import PeoplePage from './pages/PeoplePage'
import HikerDetailPage from './pages/HikerDetailPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

function DashboardRoute() {
  useUrlState()

  return (
    <div className="fixed inset-x-0 bottom-0 top-12 overflow-hidden bg-[#030303]">
      <GlobeScene />
      <HikerCard />
    </div>
  )
}

function AlertsWatcher() {
  useCriticalAlerts()
  useLiveData()
  return null
}

const navClass = ({ isActive }) =>
  [
    'text-sm tracking-wide transition-opacity',
    isActive ? 'text-white opacity-100 underline underline-offset-4' : 'text-white/60 hover:text-white/85',
  ].join(' ')

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030303] text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-md">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img
              src="/sigma-mark.png"
              alt=""
              className="h-7 w-7 shrink-0 rounded-[6px] object-cover"
            />
            <span className="text-sm font-medium tracking-[0.16em] text-white/90">Sigma</span>
          </div>

          <nav className="flex items-center gap-5">
            <NavLink to="/" end className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/people" className={navClass}>
              People
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              Settings
            </NavLink>
          </nav>
        </div>
      </header>

      <AlertsWatcher />
      <ToastContainer />
      <SosAlert />
      <main>
        <Routes>
          <Route path="/" element={<DashboardRoute />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:id" element={<HikerDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
