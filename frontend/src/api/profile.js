import client from './client'

export const getProfile = () => client.get('/profile/')
export const createProfile = (data) => client.post('/profile/', data)
export const updateProfile = (data) => client.put('/profile/', data)
export const getRecommendations = () => client.get('/recommendations/')
export const logWeight = (data) => client.post('/recommendations/weight', data)