import React, { useState, useEffect } from 'react';
import { Sun, Moon, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import useThemeStore from '../stores/ThemeStore.js';
import { auth } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EmailVerificationPage() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [user, setUser] = useState(auth.currentUser);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const navigate = useNavigate();

  // Function to create user in backend
  const createUserInBackend = async () => {
    try {
      setIsCreatingUser(true);
      const currentUser = auth.currentUser;
      const token = await currentUser.getIdToken(true);
      
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/user/signup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("User created in backend:", res);
      return true;
    } catch (error) {
      console.error("Backend response failed:", error);
      toast.error('Failed to complete signup. Please try again.');
      return false;
    } finally {
      setIsCreatingUser(false);
    }
  };

  
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

 
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let hasShownToast = false;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await currentUser.reload(); 
        const verified = currentUser.emailVerified;
        setIsVerified(verified);
        setCheckingVerification(false);
        
        if (verified && !hasShownToast) {
          hasShownToast = true;
          const success = await createUserInBackend();
          if (success) {
            toast.success('Signup successful! 🎉');
            setTimeout(() => {
              navigate("/");
            }, 2000);
          }
        }
      } else {
        setCheckingVerification(false);
      }
    });

    const intervalId = setInterval(async () => {
      if (auth.currentUser && !isVerified && !hasShownToast) {
        await auth.currentUser.reload();
        const verified = auth.currentUser.emailVerified;
        
        if (verified) {
          hasShownToast = true;
          setIsVerified(verified);
          const success = await createUserInBackend();
          if (success) {
            toast.success('Signup successful! 🎉');
            setTimeout(() => {
              navigate("/");
            }, 2000);
          }
        }
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [isVerified]);

  const handleResendEmail = async () => {
    if (!user || !canResend) return;
    
    setResendLoading(true);
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent! Check your inbox 📧');
      
     
      setTimeLeft(120);
      setCanResend(false);
    } catch (error) {
      console.error('Resend email error:', error);
      toast.error('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await user.reload();
      const verified = user.emailVerified;
      
      if (verified) {
        setIsVerified(verified);
        const success = await createUserInBackend();
        if (success) {
          toast.success('Signup successful! 🎉');
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } else {
        toast.info('Email not verified yet. Please check your inbox.');
      }
    } catch (error) {
      console.error('Check verification error:', error);
      toast.error('Failed to check verification status.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingVerification) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Checking verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      
      <button
        onClick={toggleDarkMode}
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
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
              isVerified 
                ? 'bg-green-100 text-green-600' 
                : darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              {isVerified ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <Mail className="w-8 h-8" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight">
              {isVerified ? 'Email Verified!' : 'Verify Your Email'}
            </h1>
            
            <p className={`mt-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isVerified 
                ? isCreatingUser 
                  ? 'Creating your account...'
                  : 'Your email has been successfully verified. Redirecting to dashboard...'
                : `We've sent a verification email to ${user?.email || 'your email address'}`
              }
            </p>
          </div>

          {!isVerified && (
            <>
              
              <div className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <h3 className={`font-medium mb-2 ${
                  darkMode ? 'text-blue-400' : 'text-blue-900'
                }`}>
                  What to do next:
                </h3>
                <ul className={`text-sm space-y-1 ${
                  darkMode ? 'text-gray-300' : 'text-blue-800'
                }`}>
                  <li>• Check your email inbox for the verification link</li>
                  <li>• Look in your spam/junk folder if you don't see it</li>
                  <li>• Click the verification link in the email</li>
                  <li>• Come back to this page (it will auto-update)</li>
                </ul>
              </div>

        
              <div className="space-y-4">
                <button
                  onClick={handleCheckVerification}
                  disabled={loading || isCreatingUser}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    loading || isCreatingUser
                      ? 'bg-blue-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-2 focus:ring-blue-500/50'
                  } focus:outline-none`}
                >
                  {loading || isCreatingUser ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  {loading ? 'Checking...' : isCreatingUser ? 'Setting up account...' : 'Check Verification Status'}
                </button>

                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading || !canResend || isCreatingUser}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-medium transition-colors duration-200 ${
                    resendLoading || !canResend || isCreatingUser
                      ? 'cursor-not-allowed opacity-50'
                      : darkMode
                        ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700'
                        : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  } ${
                    darkMode
                      ? 'border-gray-600 bg-gray-800 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                >
                  {resendLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  {resendLoading 
                    ? 'Sending...' 
                    : !canResend 
                      ? `Resend in ${formatTime(timeLeft)}`
                      : "Didn't receive email? Resend"
                  }
                </button>
              </div>

             
              <div className={`text-center text-xs ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <p>Still having trouble? Contact support for assistance</p>
              </div>
            </>
          )}

         
          {!isVerified && !isCreatingUser && (
            <div className={`flex items-center justify-center gap-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-checking verification status...</span>
            </div>
          )}

          {isCreatingUser && (
            <div className={`flex items-center justify-center gap-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Setting up your account...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}