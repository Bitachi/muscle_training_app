import { useState, useEffect } from 'react'
import { getTraining, getTrainingByDate, putTraining, deleteTraining, USER_ID } from '../api'

function formatDate(d) {
  return `${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6, 8)}`
}

function groupByDate(records) {
  const map = new Map()
  for (const record of records) {
    if (!map.has(record.date)) map.set(record.date, [])
    map.get(record.date).push(record)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, exercises]) => ({ date, exercises }))
}

function SetRow({ date, exercise, set, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    weight: set.weight,
    reps: set.reps,
    memo: set.memo
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    if (!window.confirm(`SET ${set.set_no} を削除しますか？`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteTraining(date, exercise, set.set_no)
      onUpdated()
    } catch (e) {
      setError(e.message)
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (form.reps === '') {
      setError('回数は必須です')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await putTraining(date, exercise, set.set_no, {
        user_id: USER_ID,
        weight: form.weight === '' || form.weight == null ? null : Number(form.weight),
        reps: Number(form.reps),
        memo: form.memo
      })
      setEditing(false)
      onUpdated()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({ weight: set.weight, reps: set.reps, memo: set.memo })
    setError(null)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="py-3 space-y-3">
        <div className="text-xs font-bold text-teal-400">SET {set.set_no}</div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-slate-400">重量 (kg)（任意）</label>
            <input
              type="number"
              value={form.weight ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500 border-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-400">回数 (rep)</label>
            <input
              type="number"
              value={form.reps}
              onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500 border-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">メモ</label>
          <input
            type="text"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            className="w-full bg-slate-700 text-white rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500 border-none"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-teal-500 text-white rounded-lg px-3 py-1.5 disabled:opacity-50 hover:bg-teal-600 transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleCancel}
            className="text-xs text-slate-400 border border-slate-600 rounded-lg px-3 py-1.5 hover:border-slate-400 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-300 py-2">
      <span className="text-xs font-bold text-teal-400 w-12 shrink-0">SET {set.set_no}</span>
      <span className="flex-1 text-sm">
        {set.weight != null ? `${set.weight}kg` : '自重'} × {set.reps}rep
        {set.rm != null && <span className="text-xs text-slate-500 ml-2">1RM: {set.rm}kg</span>}
        {set.memo && <span className="text-xs text-slate-500 ml-2">— {set.memo}</span>}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        編集
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
      >
        {deleting ? '削除中...' : '削除'}
      </button>
    </div>
  )
}

export default function TrainingList() {
  const [filterDate, setFilterDate] = useState('')
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = (date) => {
    setLoading(true)
    setError(null)

    if (date) {
      const dateStr = date.replace(/-/g, '')
      getTrainingByDate(dateStr)
        .then((data) => setGroups(data ? [{ date: data.date, exercises: data.exercises }] : []))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    } else {
      getTraining()
        .then((data) => setGroups(groupByDate(data.records)))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => { load(filterDate) }, [filterDate])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          style={{ colorScheme: 'dark' }}
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="text-sm text-slate-400 border border-slate-700 rounded-xl px-3 py-2 hover:border-slate-500 hover:text-slate-200 transition-colors"
          >
            クリア
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-slate-500 text-sm py-10">読み込み中...</p>
      ) : error ? (
        <p className="text-center text-red-400 text-sm py-10">{error}</p>
      ) : groups.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-10">記録がありません</p>
      ) : (
        <div className="space-y-4">
          {groups.map(({ date, exercises }) => (
            <div key={date} className="bg-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-700/50 px-4 py-2.5 flex items-center gap-2">
                <span>📅</span>
                <span className="text-sm font-bold text-white">{formatDate(date)}</span>
              </div>
              <div className="divide-y divide-slate-700/50">
                {exercises.map((record) => (
                  <div key={record.exercise} className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-200 mb-1">🏋️ {record.exercise}</p>
                    <div className="space-y-0.5">
                      {record.sets.map((set) => (
                        <SetRow
                          key={set.set_no}
                          date={date}
                          exercise={record.exercise}
                          set={set}
                          onUpdated={() => load(filterDate)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
