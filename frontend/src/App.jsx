import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ForgotPasswordPage from './pages/Authentication Pages/ForgotPasswordPage';
import LoginPage from './pages/Authentication Pages/LoginPage';
import SignupPage from './pages/Authentication Pages/SignupPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
