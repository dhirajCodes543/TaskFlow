import React from 'react';
import { Mail, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useThemeStore from '../stores/themeStore.js';

export default function Footer() {
  const { darkMode } = useThemeStore();
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const currentYear = new Date().getFullYear();

  const LinkedInIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );

  const InstagramIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );

  return (
    <footer className={`transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 border-gray-800 text-gray-300' 
        : 'bg-white border-gray-200 text-gray-600'
    } border-t`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div>
            <h3 className={`text-lg font-bold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              TaskFlow
            </h3>
            <p className="text-sm">
              Building amazing experiences for our users.
            </p>
          </div>
    
          {/* Quick Links */}
          <div>
            <h4 className={`text-sm font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => handleNavigation('/')}
                  className={`hover:underline ${
                    darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                  }`}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/about')}
                  className={`hover:underline ${
                    darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                  }`}
                >
                  About
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/contact')}
                  className={`hover:underline ${
                    darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                  }`}
                >
                  Contact
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('/privacy')}
                  className={`hover:underline ${
                    darkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'
                  }`}
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className={`text-sm font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Connect With Us
            </h4>
            <div className="flex gap-3">
              <a
                href="https://www.linkedin.com/in/dhiraj-barnwal-a4ab35300/"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </a>
              <a
                href="https://www.instagram.com/ddra890"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="mailto:contact@TaskFlow.com"
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  darkMode
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`pt-6 border-t ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>
              © {currentYear} TaskFlow. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by TaskTeam
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}