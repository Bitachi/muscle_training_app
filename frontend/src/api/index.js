const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const USER_ID = '1';

export async function getParts() {
  const res = await fetch(`${BASE}/parts`);
  const data = await res.json();
  return data.parts;
}

export async function getExercises(part) {
  const res = await fetch(`${BASE}/exercises?part=${part}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.exercises ?? [];
}

export async function postTraining(payload) {
  const res = await fetch(`${BASE}/training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('登録に失敗しました');
  return res.json();
}

export async function getTraining() {
  const res = await fetch(`${BASE}/training?user_id=${USER_ID}`);
  if (!res.ok) throw new Error('履歴の取得に失敗しました');
  return res.json();
}

export async function getTrainingByDate(date) {
  const res = await fetch(`${BASE}/training/${date}?user_id=${USER_ID}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('既存セットの取得に失敗しました');
  return res.json();
}

export async function putTraining(date, exercise, set_no, payload) {
  const res = await fetch(`${BASE}/training/${date}/${exercise}/${set_no}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('更新に失敗しました');
  return res.json();
}

export async function deleteTraining(date, exercise, set_no) {
  const res = await fetch(
    `${BASE}/training/${date}/${exercise}/${set_no}?user_id=${USER_ID}`,
    { method: 'DELETE' }
  );
  if (!res.ok) throw new Error('削除に失敗しました');
  return res.json();
}

// Parts master
export async function postPart(part_code, part_name) {
  const res = await fetch(`${BASE}/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_code, part_name })
  });
  if (!res.ok) throw new Error('部位の追加に失敗しました');
  return res.json();
}

export async function putPart(part_code, part_name) {
  const res = await fetch(`${BASE}/parts/${part_code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_name })
  });
  if (!res.ok) throw new Error('部位の更新に失敗しました');
  return res.json();
}

export async function deletePart(part_code) {
  const res = await fetch(`${BASE}/parts/${part_code}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('部位の削除に失敗しました');
  return res.json();
}

// Exercises master
export async function postExercise(part_code, exercise_code, exercise_name) {
  const res = await fetch(`${BASE}/exercises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_code, exercise_code, exercise_name })
  });
  if (!res.ok) throw new Error('種目の追加に失敗しました');
  return res.json();
}

export async function putExercise(part_code, exercise_code, exercise_name) {
  const res = await fetch(`${BASE}/exercises/${part_code}/${exercise_code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_name })
  });
  if (!res.ok) throw new Error('種目の更新に失敗しました');
  return res.json();
}

export async function deleteExercise(part_code, exercise_code) {
  const res = await fetch(`${BASE}/exercises/${part_code}/${exercise_code}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('種目の削除に失敗しました');
  return res.json();
}
