import SignupPage from './userAuth/Signup'
import SignInPage from './userAuth/Signin.jsx';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import Footer from './Layout/Footer.jsx';
import EmailVerificationPage from './userAuth/EmailVerification';
import { useAuthStore } from "./stores/AuthStore.js";
import JobQueuePage from './Dashboard/JobQueue.jsx';
import { useState, useEffect } from 'react';
import Header from './Layout/Header.jsx';
import Dashboard from './Dashboard/HomePage';
import HomePage from './Dashboard/HomePage';
import Layout from './Layout/Layout.jsx';
import { connectSocket, disconnectSocket, getSocket } from "./stores/SocketManager.js"


function App() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const isVerified = useAuthStore((s) => s.isVerified)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  console.log("App re-rendered:", { isLoading, isLoggedIn, isVerified });
  
    useEffect(() => {
      let socket;
      if (isLoggedIn && isVerified) {
        socket = connectSocket();
  
        socket.on("connect", () => console.log("✅ Socket connected", socket.id));
        socket.on("disconnect", (reason) => console.warn("⚠️ Socket disconnected", reason));
      }
  
      return () => {
        if (socket) disconnectSocket();
      };
    }, [isLoggedIn,isVerified]);
    
  if (isLoading) {
    return <div>Loading....</div>
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/signup"
            element={
              isLoggedIn && isVerified ? <Navigate to="/" /> : <SignupPage />
            }
          />
          <Route
            path="/signin"
            element={
              isLoggedIn && isVerified ? <Navigate to="/" /> : <SignInPage />
            }
          />
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                isLoggedIn && isVerified ? <Dashboard /> : <Navigate to="/signup" />
              }
            />
            <Route
              path="/group/:groupId"
              element={
                isLoggedIn && isVerified
                  ? <JobQueuePage />
                  : <Navigate to="/signup" />
              }
            />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route
            path="/verification"
            element={
              isLoggedIn && !isVerified ? <EmailVerificationPage /> : <Navigate to="/" />
            }
          />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </>
  )
}

export default App
