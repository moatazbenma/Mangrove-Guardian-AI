import './App.css'
import { BrowserRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { LoginPage } from './pages/auth/LoginPage'
import { Dashboard } from './pages/dashboard/Dashboard'
import { ReportForm } from './pages/reports/ReportForm'
import { RegisterPage } from './pages/auth/RegisterPage'
import { RestorationProjectsPage } from './pages/restoration'
import { LandingPage } from './pages/public'
import { RateLimitNotification } from './components/RateLimitNotification'

function App() {

  return (
    <BrowserRouter>
      <RateLimitNotification />
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<LoginPage />}/>
        <Route path='/dashboard' element={<Dashboard />}/>
        <Route path="/report" element={<ReportForm />} />
        <Route path='/restoration/projects' element={<RestorationProjectsPage />} />
        <Route path='/register' element={<RegisterPage/> }/>
      </Routes>

    </BrowserRouter>
  )

}
export default App
