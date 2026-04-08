import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DatabasePage from './pages/DatabasePage'
import VaultPage from './pages/VaultPage'
import BackupPage from './pages/BackupPage'
import SyncPage from './pages/SyncPage'
import HelpPage from './pages/HelpPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DatabasePage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/backup" element={<BackupPage />} />
        <Route path="/sync" element={<SyncPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>
    </Routes>
  )
}

export default App
