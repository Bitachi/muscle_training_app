import { useState } from 'react'
import TrainingForm from './pages/TrainingForm'
import TrainingList from './pages/TrainingList'
import MasterManagement from './pages/MasterManagement'

const TABS = [
  { key: 'form', label: '記録する' },
  { key: 'list', label: '履歴' },
  { key: 'master', label: 'マスタ' }
]

export default function App() {
  const [tab, setTab] = useState('form')

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="bg-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💪</span>
          <h1 className="text-lg font-bold">筋トレ記録</h1>
        </div>
        <span className="text-red-400 text-xs font-medium flex items-center gap-1">
          🔥 継続は力なり！
        </span>
      </header>

      <nav className="flex gap-2 bg-slate-900 px-4 pt-1 pb-3">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
              tab === key
                ? 'bg-teal-500 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="max-w-lg mx-auto p-4">
        {tab === 'form' && <TrainingForm />}
        {tab === 'list' && <TrainingList />}
        {tab === 'master' && <MasterManagement />}
      </main>
    </div>
  )
}
