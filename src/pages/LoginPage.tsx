// File: src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { usersApi } from '../lib/api';
import { User, Shield, LogIn, Eye, EyeOff, UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { state, dispatch } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAs, setLoginAs] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Minimal refresh fix: restore user session and last page
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const currentPage = localStorage.getItem('currentPage');

    if (token && user) {
      dispatch({
        type: 'LOGIN',
        payload: JSON.parse(user),
      });

      if (currentPage) {
        onNavigate(currentPage); // navigate to last visited page
      }
    }
  }, []);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    // Online login
    if (state.isOnline) {
      try {
        const data = await usersApi.login({ email: email.trim(), password });

        // role checks remain unchanged
        if (loginAs === 'admin' && !data.user.isAdmin) {
          setError('This account does not have admin access.');
          setLoading(false);
          return;
        }
        if (loginAs === 'user' && data.user.isAdmin) {
          setError('This is an admin account. Please select "Admin" to login.');
          setLoading(false);
          return;
        }

        // Minimal fix: persist current page
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('currentPage', window.location.pathname);

        dispatch({
          type: 'LOGIN',
          payload: {
            name: data.user.name,
            email: data.user.email,
            isAdmin: data.user.isAdmin,
            userId: data.user.id,
          },
        });

        onNavigate(data.user.isAdmin ? 'admin-dashboard' : 'home');
        return;
      } catch (err: any) {
        setError(err.message || 'Login failed');
        setLoading(false);
        return;
      }
    }

    // Offline fallback
    const user = state.registeredUsers.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) {
      setError('No account found with this email. Please register first.');
      setLoading(false);
      return;
    }
    if (user.password !== password) {
      setError('Incorrect password.');
      setLoading(false);
      return;
    }
    if (loginAs === 'admin' && !user.isAdmin) {
      setError('This account does not have admin access.');
      setLoading(false);
      return;
    }
    if (loginAs === 'user' && user.isAdmin) {
      setError('This is an admin account. Please select "Admin" to login.');
      setLoading(false);
      return;
    }

    // Minimal fix: persist offline login and current page
    localStorage.setItem('user', JSON.stringify({
      id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin,
    }));
    localStorage.setItem('currentPage', window.location.pathname);

    dispatch({
      type: 'LOGIN',
      payload: { name: user.name, email: user.email, isAdmin: user.isAdmin, userId: user.id },
    });

    setLoading(false);
    onNavigate(user.isAdmin ? 'admin-dashboard' : 'home');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // registration logic remains unchanged
  };

  const handleLoginAsChange = (role: 'user' | 'admin') => {
    // toggle logic remains unchanged
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pt-20 flex items-center justify-center p-4">
      {/* all your existing JSX remains exactly the same */}
    </div>
  );
}
