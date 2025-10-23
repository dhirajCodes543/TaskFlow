import React, { useState } from 'react';
import { Sun, Moon, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import useThemeStore from '../stores/ThemeStore.js';
import { auth } from '../firebase.js';
import axios from 'axios';

const googleProvider = new GoogleAuthProvider();

export default function SignInPage() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({
    email: false,
    google: false,
    reset: false
  });
  const [showResetPassword, setShowResetPassword] = useState(false);

  const navigate = useNavigate();

  // Function to create user in backend
  const createUserInBackend = async (user) => {
    try {
      const token = await user.getIdToken(true);
      
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/signup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("User created in backend:", res);
      return true;
    } catch (error) {
      console.error("Backend user creation failed:", error);
      toast.error('Failed to complete account setup. Please try again.');
      return false;
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(prev => ({ ...prev, email: true }));
    setErrors({});
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      console.log('User signed in:', userCredential.user);
      
      toast.success('Welcome back! 🎉');
      setFormData({ email: '', password: '' });
      
      setTimeout(() => {
        navigate("/"); 
      }, 2000);
      
    } catch (error) {
      console.error('Email sign-in error:', error);
      let errorMessage = 'Failed to sign in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password';
          break;
        default:
          errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(prev => ({ ...prev, google: true }));
    setErrors({});
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user);
      
      // Check if this is a new user (first time signing in with Firebase)
      const isNewUser = result._tokenResponse?.isNewUser || false;
      
      if (isNewUser) {
        console.log('New user detected, creating account in backend...');
        const success = await createUserInBackend(result.user);
        if (success) {
          toast.success('Account created successfully! 🎉');
          setTimeout(() => {
            navigate("/"); 
          }, 2000);
        }
      } else {
        console.log('Existing user, signing in...');
        toast.success('Welcome back! 🎉');
        setTimeout(() => {
          navigate("/"); 
        }, 2000);
      }
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      let errorMessage = 'Failed to sign in with Google';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in cancelled';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'Account exists with different sign-in method';
          break;
        default:
          errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(prev => ({ ...prev, google: false }));
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }
    
    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(prev => ({ ...prev, reset: true }));
    setErrors({});
    
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success('Password reset email sent! Check your inbox 📧');
      setShowResetPassword(false);
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        default:
          errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(prev => ({ ...prev, reset: false }));
    }
  };

  const setDarkMode = () => {
    toggleDarkMode();
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      
      <button
        onClick={setDarkMode}
        className={`fixed top-4 right-4 p-2 rounded-lg transition-colors duration-200 ${
          darkMode
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-md'
        }`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className={`mt-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Sign in to your account to continue
            </p>
          </div>

          
          {errors.general && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

         
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading.google}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg font-medium transition-colors duration-200 ${
                darkMode
                  ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500'
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500'
              } disabled:cursor-not-allowed`}
              aria-label="Sign in with Google"
            >
              {loading.google ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {loading.google ? 'Signing in...' : 'Continue with Google'}
            </button>
          </div>

          
          <div className="relative">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-300'
              }`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${
                darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
                Or continue with email
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-4 h-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors duration-200 ${
                    errors.email
                      ? darkMode
                        ? 'border-red-500 bg-gray-800 text-white placeholder-gray-500'
                        : 'border-red-500 bg-white text-gray-900 placeholder-gray-400'
                      : darkMode
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 w-4 h-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors duration-200 ${
                    errors.password
                      ? darkMode
                        ? 'border-red-500 bg-gray-800 text-white placeholder-gray-500'
                        : 'border-red-500 bg-white text-gray-900 placeholder-gray-400'
                      : darkMode
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-400'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            {showResetPassword && (
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className="text-sm mb-2">
                  Enter your email above and click the button below to receive a password reset link.
                </p>
                <button
                  onClick={handlePasswordReset}
                  disabled={loading.reset}
                  className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    loading.reset
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading.reset ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    'Send reset email'
                  )}
                </button>
              </div>
            )}
              
            <button
              onClick={handleEmailSignIn}
              disabled={loading.email}
              className={`w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg font-medium text-white transition-colors duration-200 ${
                loading.email
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/50'
              } focus:outline-none`}
            >
              {loading.email ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          
          <p className={`text-center text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Don't have an account?{' '}
            <button
             onClick={()=>navigate("/signup")}
             className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}