import { useState, useEffect } from 'react'
import {
  getParts, postPart, putPart, deletePart,
  getExercises, postExercise, putExercise, deleteExercise
} from '../api'

function PartRow({ part, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [partName, setPartName] = useState(part.part_name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    if (!partName.trim()) { setError('部位名を入力してください'); return }
    setSaving(true); setError(null)
    try {
      await putPart(part.part_code, partName.trim())
      setEditing(false)
      onUpdated()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`「${part.part_name}」を削除しますか？`)) return
    try {
      await deletePart(part.part_code)
      onUpdated()
    } catch (e) { setError(e.message) }
  }

  if (editing) {
    return (
      <div className="py-3 space-y-2">
        <input
          type="text"
          value={partName}
          onChange={(e) => setPartName(e.target.value)}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 border-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="text-xs bg-teal-500 text-white rounded-lg px-3 py-1.5 disabled:opacity-50 hover:bg-teal-600 transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
          <button onClick={() => { setPartName(part.part_name); setEditing(false) }}
            className="text-xs text-slate-400 border border-slate-600 rounded-lg px-3 py-1.5 hover:border-slate-400 transition-colors">
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-200">
        {part.part_name}
        <span className="text-xs text-slate-500 ml-2">({part.part_code})</span>
      </span>
      <div className="flex gap-3">
        <button onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors">編集</button>
        <button onClick={handleDelete}
          className="text-xs text-red-400 hover:text-red-300 transition-colors">削除</button>
      </div>
    </div>
  )
}

function PartsSection() {
  const [parts, setParts] = useState([])
  const [partCode, setPartCode] = useState('')
  const [partName, setPartName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  const load = () => getParts().then(setParts).catch(() => {})

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!partCode.trim() || !partName.trim()) {
      setError('コードと名前を入力してください'); return
    }
    setAdding(true); setError(null)
    try {
      await postPart(partCode.trim().toUpperCase(), partName.trim())
      setPartCode(''); setPartName('')
      load()
    } catch (e) { setError(e.message) } finally { setAdding(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-200">部位を追加</p>
        <div className="flex gap-2">
          <input type="text" value={partCode} onChange={(e) => setPartCode(e.target.value)}
            placeholder="コード (例: CHEST)"
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 border-none" />
          <input type="text" value={partName} onChange={(e) => setPartName(e.target.value)}
            placeholder="名前 (例: 胸)"
            className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 border-none" />
          <button onClick={handleAdd} disabled={adding}
            className="text-sm bg-teal-500 text-white rounded-lg px-4 py-2 disabled:opacity-50 hover:bg-teal-600 transition-colors shrink-0">
            追加
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <div className="bg-slate-800 rounded-2xl divide-y divide-slate-700/50">
        {parts.length === 0
          ? <p className="text-sm text-slate-500 text-center py-6">部位がありません</p>
          : parts.map((p) => (
            <div key={p.part_code} className="px-4">
              <PartRow part={p} onUpdated={load} />
            </div>
          ))
        }
      </div>
    </div>
  )
}

function ExerciseRow({ part_code, exercise, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [exerciseName, setExerciseName] = useState(exercise.exercise_name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async () => {
    if (!exerciseName.trim()) { setError('種目名を入力してください'); return }
    setSaving(true); setError(null)
    try {
      await putExercise(part_code, exercise.exercise_code, exerciseName.trim())
      setEditing(false)
      onUpdated()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`「${exercise.exercise_name}」を削除しますか？`)) return
    try {
      await deleteExercise(part_code, exercise.exercise_code)
      onUpdated()
    } catch (e) { setError(e.message) }
  }

  if (editing) {
    return (
      <div className="py-3 space-y-2">
        <input type="text" value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          className="w-full bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 border-none" />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="text-xs bg-teal-500 text-white rounded-lg px-3 py-1.5 disabled:opacity-50 hover:bg-teal-600 transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
          <button onClick={() => { setExerciseName(exercise.exercise_name); setEditing(false) }}
            className="text-xs text-slate-400 border border-slate-600 rounded-lg px-3 py-1.5 hover:border-slate-400 transition-colors">
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-200">
        {exercise.exercise_name}
        <span className="text-xs text-slate-500 ml-2">({exercise.exercise_code})</span>
      </span>
      <div className="flex gap-3">
        <button onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors">編集</button>
        <button onClick={handleDelete}
          className="text-xs text-red-400 hover:text-red-300 transition-colors">削除</button>
      </div>
    </div>
  )
}

function ExercisesSection() {
  const [parts, setParts] = useState([])
  const [selectedPart, setSelectedPart] = useState('')
  const [exercises, setExercises] = useState([])
  const [exerciseCode, setExerciseCode] = useState('')
  const [exerciseName, setExerciseName] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { getParts().then(setParts).catch(() => {}) }, [])

  const loadExercises = (part) => {
    getExercises(part).then(setExercises).catch(() => setExercises([]))
  }

  const handlePartChange = (part) => {
    setSelectedPart(part)
    setExercises([])
    setExerciseCode(''); setExerciseName('')
    if (part) loadExercises(part)
  }

  const handleAdd = async () => {
    if (!exerciseCode.trim() || !exerciseName.trim()) {
      setError('コードと名前を入力してください'); return
    }
    setAdding(true); setError(null)
    try {
      await postExercise(selectedPart, exerciseCode.trim().toUpperCase(), exerciseName.trim())
      setExerciseCode(''); setExerciseName('')
      loadExercises(selectedPart)
    } catch (e) { setError(e.message) } finally { setAdding(false) }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-200 mb-2">部位を選択</label>
        <select value={selectedPart} onChange={(e) => handlePartChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500">
          <option value="" className="bg-slate-800">選択してください</option>
          {parts.map((p) => (
            <option key={p.part_code} value={p.part_code} className="bg-slate-800">{p.part_name}</option>
          ))}
        </select>
      </div>

      {selectedPart && (
        <>
          <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-200">種目を追加</p>
            <div className="flex gap-2">
              <input type="text" value={exerciseCode}
                onChange={(e) => setExerciseCode(e.target.value)}
                placeholder="コード (例: BENCHPRESS)"
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 border-none" />
              <input type="text" value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="名前 (例: ベンチプレス)"
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 border-none" />
              <button onClick={handleAdd} disabled={adding}
                className="text-sm bg-teal-500 text-white rounded-lg px-4 py-2 disabled:opacity-50 hover:bg-teal-600 transition-colors shrink-0">
                追加
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          <div className="bg-slate-800 rounded-2xl divide-y divide-slate-700/50">
            {exercises.length === 0
              ? <p className="text-sm text-slate-500 text-center py-6">種目がありません</p>
              : exercises.map((ex) => (
                <div key={ex.exercise_code} className="px-4">
                  <ExerciseRow
                    part_code={selectedPart}
                    exercise={ex}
                    onUpdated={() => loadExercises(selectedPart)}
                  />
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  )
}

export default function MasterManagement() {
  const [tab, setTab] = useState('parts')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
        <button onClick={() => setTab('parts')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'parts' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}>
          部位
        </button>
        <button onClick={() => setTab('exercises')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'exercises' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}>
          種目
        </button>
      </div>

      {tab === 'parts' ? <PartsSection /> : <ExercisesSection />}
    </div>
  )
}
