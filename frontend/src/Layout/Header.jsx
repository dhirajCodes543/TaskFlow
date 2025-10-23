import React, { useState } from 'react';
import { Sun, Moon, Home, Mail, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useThemeStore from '../stores/ThemeStore.js';
import { useAuthStore } from '../stores/AuthStore.js';
import { auth } from '../firebase.js';

export default function Header() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { isLoggedIn, isVerified } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      toast.success('Logged out successfully! 👋');
      setShowLogoutConfirm(false);
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoggingOut(false);
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const setDarkMode = () => {
    toggleDarkMode();
  };

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 border-gray-800' 
        : 'bg-white border-gray-200'
    } border-b`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleNavigation('/')}
              className={`text-xl font-bold transition-colors duration-200 ${
                darkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
              }`}
            >
              TaskFlow
            </button>
          </div>

          {/* Desktop Navigation - Right Side */}
          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn && (
              <>
                <button
                  onClick={() => handleNavigation('/')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>

                <button
                  onClick={() => handleNavigation('/contact')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </button>
              </>
            )}

            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavigation('/signin')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>

                <button
                  onClick={() => handleNavigation('/signup')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </>
            ) : (
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={setDarkMode}
              className={`ml-2 p-2 rounded-lg transition-colors duration-200 ${
                darkMode
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile buttons */}
          <div className="flex md:hidden items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={setDarkMode}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                darkMode
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden py-4 space-y-2 border-t ${
            darkMode ? 'border-gray-800' : 'border-gray-200'
          }`}>
            {isLoggedIn && (
              <>
                <button
                  onClick={() => handleNavigation('/')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>

                <button
                  onClick={() => handleNavigation('/contact')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </button>
              </>
            )}

            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavigation('/signin')}
                  className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>

                <button
                  onClick={() => handleNavigation('/signup')}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </>
            ) : (
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Confirm Logout
            </h3>
            <p className={`mb-6 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Are you sure you want to logout?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                disabled={loggingOut}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors duration-200 ${
                  loggingOut
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loggingOut ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging out...
                  </div>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}