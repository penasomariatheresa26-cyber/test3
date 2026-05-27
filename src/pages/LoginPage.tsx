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

  // restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      dispatch({
        type: 'LOGIN',
        payload: {
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          userId: user.id,
        },
      });
      onNavigate(user.isAdmin ? 'admin-dashboard' : 'home');
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

    try {
      const data = await usersApi.login({ email: email.trim(), password });

      // Check role match
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

      // persist login
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

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
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await usersApi.register({ email: email.trim(), password, name: name.trim() });
      setSuccess('Account created successfully! You can now login.');
      setMode('login');
      setLoginAs('user');
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsChange = (role: 'user' | 'admin') => {
    setLoginAs(role);
    setError('');
    setSuccess('');
    if (role === 'admin' && mode === 'register') {
      setMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pt-20 flex items-center justify-center p-4">
      {/* rest of your JSX form and UI remains unchanged */}
    </div>
  );
}
