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

const spinnerHide = '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

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
    <div className="space-y-4">
      {success && (
        <div className="bg-teal-900/50 border border-teal-700 text-teal-300 rounded-xl p-3 text-sm">
          ✅ 登録しました
        </div>
      )}
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl p-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <span>📅</span><span>日付</span>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-white text-xs focus:outline-none"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        <div className="bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <span>🦾</span><span>部位</span>
          </div>
          <select
            value={selectedPart}
            onChange={(e) => setSelectedPart(e.target.value)}
            className="w-full bg-transparent text-white text-xs focus:outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-800 text-slate-400">選択</option>
            {parts.map((p) => (
              <option key={p.part_code} value={p.part_code} className="bg-slate-800">{p.part_name}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <span>🏋️</span><span>種目</span>
          </div>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            disabled={!selectedPart}
            className="w-full bg-transparent text-white text-xs focus:outline-none appearance-none cursor-pointer disabled:text-slate-600 disabled:cursor-default"
          >
            <option value="" className="bg-slate-800 text-slate-400">選択</option>
            {exercises.map((ex) => (
              <option key={ex.exercise_code} value={ex.exercise_code} className="bg-slate-800">
                {ex.exercise_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-200">
            セット
            {loadingSets && (
              <span className="text-xs text-slate-500 font-normal ml-2">読み込み中...</span>
            )}
          </span>
          <button
            onClick={addSet}
            disabled={loadingSets}
            className="flex items-center gap-1 bg-teal-500 text-white text-sm font-medium rounded-xl px-4 py-2 hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            + セット追加
          </button>
        </div>

        <div className="space-y-3">
          {sets.map((s, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  SET {s.set_no}
                </span>
                {sets.length > 1 && (
                  <button
                    onClick={() => removeSet(i)}
                    className="text-xs text-red-400 bg-red-900/30 px-3 py-1 rounded-full hover:bg-red-900/50 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                    <span>🏋️</span><span>重量 (kg)</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-700 rounded-xl px-2 py-2">
                    <button
                      onClick={() => {
                        if (s.weight === '') return
                        updateSet(i, 'weight', String(Math.max(0, Number(s.weight) - 2.5)))
                      }}
                      className="w-8 h-8 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center shrink-0 hover:bg-slate-500 transition-colors"
                    >
                      −
                    </button>
                    <div className="flex items-baseline gap-0.5">
                      <input
                        type="number"
                        value={s.weight}
                        onChange={(e) => updateSet(i, 'weight', e.target.value)}
                        className={`text-white font-bold text-xl text-center w-14 bg-transparent border-none focus:outline-none ${spinnerHide}`}
                        placeholder="0"
                      />
                      <span className="text-slate-400 text-xs">kg</span>
                    </div>
                    <button
                      onClick={() => updateSet(i, 'weight', String(Number(s.weight || 0) + 2.5))}
                      className="w-8 h-8 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center shrink-0 hover:bg-slate-500 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                    <span>🔄</span><span>回数 (rep)</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-700 rounded-xl px-2 py-2">
                    <button
                      onClick={() => updateSet(i, 'reps', String(Math.max(0, Number(s.reps || 0) - 1)))}
                      className="w-8 h-8 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center shrink-0 hover:bg-slate-500 transition-colors"
                    >
                      −
                    </button>
                    <div className="flex items-baseline gap-0.5">
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) => updateSet(i, 'reps', e.target.value)}
                        className={`text-white font-bold text-xl text-center w-14 bg-transparent border-none focus:outline-none ${spinnerHide}`}
                        placeholder="0"
                      />
                      <span className="text-slate-400 text-xs">rep</span>
                    </div>
                    <button
                      onClick={() => updateSet(i, 'reps', String(Number(s.reps || 0) + 1))}
                      className="w-8 h-8 rounded-full bg-slate-600 text-white font-bold flex items-center justify-center shrink-0 hover:bg-slate-500 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>📝</span><span>メモ</span>
                </div>
                <input
                  type="text"
                  value={s.memo}
                  onChange={(e) => updateSet(i, 'memo', e.target.value)}
                  className="w-full bg-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
        className="w-full bg-teal-500 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors"
      >
        💾 {submitting ? '登録中...' : 'トレーニングを記録'}
      </button>
    </div>
  )
}
