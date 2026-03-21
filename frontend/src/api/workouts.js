import client from './client'

export const logWorkout = (data) => client.post('/workouts/', data)
export const getWorkouts = () => client.get('/workouts/')
export const getPRs = () => client.get('/workouts/prs')
export const searchExercises = (q) => client.get(`/workouts/exercises/search?q=${encodeURIComponent(q)}`)
export const createExercise = (data) => client.post('/workouts/exercises', data)