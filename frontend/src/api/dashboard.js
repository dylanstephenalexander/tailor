import client from './client'

export const getDashboard = (date) => client.get(`/dashboard/${date}`)