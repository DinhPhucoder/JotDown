// import { useState, useEffect } from 'react'
// import Header from './components/landing/Header'
// import Footer from './components/landing/Footer'
// import Hero from './components/landing/Hero'
// import Features from './components/landing/Features'
// import MockNotesPreview from './components/landing/MockNotesPreview'
// import './App.css'
import LoginPage from './pages/LoginPage'

function App() {
  // TẠM THỜI: Render LoginPage để xem giao diện
  return <LoginPage />;

  // --- LandingPage gốc (bỏ comment khi cần) ---
  // const [theme, setTheme] = useState(() => {
  //   return localStorage.getItem('theme') || 'dark';
  // });
  // useEffect(() => {
  //   document.documentElement.setAttribute('data-bs-theme', theme);
  //   localStorage.setItem('theme', theme);
  // }, [theme]);
  // const toggleTheme = () => {
  //   setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  // };
  // return (
  //   <div className="landing-app d-flex flex-column min-vh-100">
  //     <Header theme={theme} toggleTheme={toggleTheme} />
  //     <main className="flex-grow-1">
  //       <Hero />
  //       <MockNotesPreview />
  //       <Features />
  //     </main>
  //     <Footer />
  //   </div>
  // )
}

export default App
