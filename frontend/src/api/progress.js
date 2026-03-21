import client from './client'

export const getPRs = () => client.get('/workouts/prs')
export const getExerciseHistory = (exerciseId) => client.get(`/workouts/exercise/${exerciseId}/history`)
export const getExercises = () => client.get('/workouts/exercises')
export const logWeight = (data) => client.post('/recommendations/weight', data)
export const getRecommendations = () => client.get('/recommendations/')