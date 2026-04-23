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
      <div className="py-2 space-y-2">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
          SET {set.set_no}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500">重量 (kg)（任意）</label>
            <input
              type="number"
              value={form.weight ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">回数 (rep)</label>
            <input
              type="number"
              value={form.reps}
              onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">メモ</label>
          <input
            type="text"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-gray-900 text-white rounded px-3 py-1 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleCancel}
            className="text-xs text-gray-500 border border-gray-300 rounded px-3 py-1"
          >
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 py-1">
      <span className="text-xs font-semibold text-gray-400 w-10">SET {set.set_no}</span>
      <span className="flex-1">
        {set.weight != null ? `${set.weight}kg` : '自重'} × {set.reps}rep
        {set.rm != null && <span className="text-xs text-gray-400 ml-2">1RM: {set.rm}kg</span>}
        {set.memo && <span className="text-xs text-gray-400 ml-2">— {set.memo}</span>}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-gray-400 hover:text-gray-700 underline"
      >
        編集
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-red-400 hover:text-red-600 underline disabled:opacity-50"
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
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="text-sm text-gray-500 border border-gray-300 rounded px-3 py-2 hover:bg-gray-50"
          >
            クリア
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 text-sm py-10">読み込み中...</p>
      ) : error ? (
        <p className="text-center text-red-500 text-sm py-10">{error}</p>
      ) : groups.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">記録がありません</p>
      ) : (
        <div className="space-y-5">
          {groups.map(({ date, exercises }) => (
            <div key={date} className="bg-white rounded border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">{formatDate(date)}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {exercises.map((record) => (
                  <div key={record.exercise} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 mb-2">{record.exercise}</p>
                    <div className="space-y-1">
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
