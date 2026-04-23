import { useState, useEffect } from 'react'
import { getParts, getExercises, getTrainingByDate, postTraining, USER_ID } from '../api'

const today = new Date().toISOString().slice(0, 10)

const emptySet = (set_no) => ({ set_no, weight: '', reps: '', memo: '' })

const toFormSet = (s) => ({
  set_no: s.set_no,
  weight: s.weight,
  reps: s.reps,
  memo: s.memo ?? ''
})

export default function TrainingForm() {
  const [parts, setParts] = useState([])
  const [exercises, setExercises] = useState([])
  const [selectedPart, setSelectedPart] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [date, setDate] = useState(today)
  const [sets, setSets] = useState([emptySet(1)])
  const [loadingSets, setLoadingSets] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getParts().then(setParts).catch(() => setError('部位の取得に失敗しました'))
  }, [])

  useEffect(() => {
    if (!selectedPart) return
    setSelectedExercise('')
    setExercises([])
    setSets([emptySet(1)])
    getExercises(selectedPart)
      .then(setExercises)
      .catch(() => setError('種目の取得に失敗しました'))
  }, [selectedPart])

  // 日付・種目が揃ったら既存セットを取得してフォームに反映
  useEffect(() => {
    if (!date || !selectedExercise) {
      setSets([emptySet(1)])
      return
    }

    const dateStr = date.replace(/-/g, '')
    setLoadingSets(true)
    getTrainingByDate(dateStr)
      .then((data) => {
        if (!data) {
          setSets([emptySet(1)])
          return
        }
        const existing = data.exercises?.find((ex) => ex.exercise === selectedExercise)
        if (existing && existing.sets.length > 0) {
          setSets(existing.sets.map(toFormSet))
        } else {
          setSets([emptySet(1)])
        }
      })
      .catch(() => setSets([emptySet(1)]))
      .finally(() => setLoadingSets(false))
  }, [date, selectedExercise])

  const updateSet = (i, field, value) => {
    setSets((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    )
  }

  const addSet = () => {
    setSets((prev) => [...prev, emptySet(prev.length + 1)])
  }

  const removeSet = (i) => {
    setSets((prev) =>
      prev
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, set_no: idx + 1 }))
    )
  }

  const handleSubmit = async () => {
    if (!selectedPart || !selectedExercise || !date || sets.length === 0) {
      setError('部位・種目・日付・セットをすべて入力してください')
      return
    }
    const invalid = sets.some((s) => s.reps === '')
    if (invalid) {
      setError('全セットの回数を入力してください')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await postTraining({
        user_id: USER_ID,
        date: date.replace(/-/g, ''),
        exercise: selectedExercise,
        sets: sets.map((s) => ({
          set_no: s.set_no,
          weight: s.weight === '' ? null : Number(s.weight),
          reps: Number(s.reps),
          memo: s.memo
        }))
      })
      setSuccess(true)
      setSelectedPart('')
      setSelectedExercise('')
      setExercises([])
      setSets([emptySet(1)])
      setDate(today)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {success && (
        <div className="bg-green-100 text-green-800 rounded p-3 text-sm">
          登録しました
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">部位</label>
        <select
          value={selectedPart}
          onChange={(e) => setSelectedPart(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
        >
          <option value="">選択してください</option>
          {parts.map((p) => (
            <option key={p.part_code} value={p.part_code}>{p.part_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">種目</label>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          disabled={!selectedPart}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
        >
          <option value="">選択してください</option>
          {exercises.map((ex) => (
            <option key={ex.exercise_code} value={ex.exercise_code}>
              {ex.exercise_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            セット
            {loadingSets && (
              <span className="text-xs text-gray-400 font-normal ml-2">読み込み中...</span>
            )}
          </label>
          <button
            onClick={addSet}
            disabled={loadingSets}
            className="text-sm text-gray-900 font-medium border border-gray-900 rounded px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
          >
            + セット追加
          </button>
        </div>

        <div className="space-y-3">
          {sets.map((s, i) => (
            <div key={i} className="bg-white rounded border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500">SET {s.set_no}</span>
                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">重量 (kg)（任意）</label>
                  <input
                    type="number"
                    value={s.weight}
                    onChange={(e) => updateSet(i, 'weight', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
                    placeholder="80"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">回数 (rep)</label>
                  <input
                    type="number"
                    value={s.reps}
                    onChange={(e) => updateSet(i, 'reps', e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">メモ</label>
                <input
                  type="text"
                  value={s.memo}
                  onChange={(e) => updateSet(i, 'memo', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-0.5"
                  placeholder="調子良い"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || loadingSets}
        className="w-full bg-gray-900 text-white rounded py-3 font-medium text-sm disabled:opacity-50"
      >
        {submitting ? '登録中...' : '登録'}
      </button>
    </div>
  )
}
