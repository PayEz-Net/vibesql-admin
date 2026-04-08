import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        <StatusBar />
      </div>
    </div>
  )
}
