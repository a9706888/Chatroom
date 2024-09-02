import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import React from 'react';
import Home from './pages/Home';
import Login from './pages/Login';

function App() {

  return (
      <Router>
          <Routes>
            <Route path='/login' element={<Login />}/>
            <Route path='/' element={<Home />}/>
          </Routes>
      </Router>
      
      
  );
}

export default App;
