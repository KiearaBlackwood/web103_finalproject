import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {

  return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* Add more routes here */}
            </Routes>
        </BrowserRouter>
  )
}

export default App
