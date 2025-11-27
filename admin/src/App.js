import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './AppLayout'; 
import Sidebar from './sidebar';
import Dashboard from './pages/Dashboard';
import ImportantDates from './pages/ImportantDates';
import News from './pages/News';
import Services from './pages/Services';
import Navigation from './pages/Navigation';
import HelpSupport from './pages/HelpSupport';
import AboutUs from './pages/AboutUs';
import './App.css';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="important-dates" element={<ImportantDates />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/important-dates" element={<ImportantDates />} />
          <Route path="/news" element={<News />} />
          <Route path="/services" element={<Services />} />
          {/* <Route path="/navigation" element={<Navigation />} /> */}
          <Route path="/help-support" element={<HelpSupport />} />
          <Route path="/about-us" element={<AboutUs />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;