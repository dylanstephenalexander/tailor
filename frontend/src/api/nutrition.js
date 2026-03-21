import client from './client'

export const searchFood = (q) => client.get(`/nutrition/search?q=${encodeURIComponent(q)}`)
export const lookupBarcode = (barcode) => client.get(`/nutrition/barcode/${barcode}`)
export const logFood = (data) => client.post('/log/', data)