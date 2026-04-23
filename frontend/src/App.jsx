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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white px-4 py-3">
        <h1 className="text-lg font-bold">筋トレ記録</h1>
      </header>

      <nav className="flex border-b border-gray-300 bg-white">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-medium ${
              tab === key
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500'
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
