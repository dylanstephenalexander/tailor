import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Workouts from './pages/Workouts'
import Profile from './pages/Profile'
import Food from './pages/Food'
import LogWorkout from './pages/LogWorkout'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import './styles/global.css'

const Protected = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        {/* auth */}
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* major pages */}
        <Route path="/"          element={<Protected><Dashboard /></Protected>} />
        <Route path="/nutrition" element={<Protected><Nutrition /></Protected>} />
        <Route path="/workouts"  element={<Protected><Workouts /></Protected>} />
        <Route path="/profile"   element={<Protected><Profile /></Protected>} />

        {/* minor pages */}
        <Route path="/food"        element={<Protected><Food /></Protected>} />
        <Route path="/log-workout" element={<Protected><LogWorkout /></Protected>} />
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
