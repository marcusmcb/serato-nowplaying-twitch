import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import MainApp from './components/MainApp'
import CrateStats from './components/CrateStats'
import './App.css'

const App = () => {
  
  return (
    <Router>
      <Routes>
        <Route path='/' element={<MainApp/>} />
        <Route path='/cratestats' element={<CrateStats />} />
      </Routes>      
    </Router>
  )
}

export default App
