import client from './client'

export const searchFood = (q) => client.get(`/nutrition/search?q=${encodeURIComponent(q)}`)
export const lookupBarcode = (barcode) => client.get(`/nutrition/barcode/${barcode}`)
export const logFood = (data) => client.post('/log/', data)
export const getLog = (date) => client.get(`/log/${date}`)
export const getAlerts = () => client.get('/alerts/')
export const getRecommendations = () => client.get('/recommendations/')