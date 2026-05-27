// inside your existing handleLogin function, right after successful login API or offline login:

// persist login info and current page
localStorage.setItem('token', data.token);
localStorage.setItem('user', JSON.stringify(data.user));
localStorage.setItem('currentPage', window.location.pathname); // saves the current route

dispatch({
  type: 'LOGIN',
  payload: {
    name: data.user.name,
    email: data.user.email,
    isAdmin: data.user.isAdmin,
    userId: data.user.id,
  },
});

// navigate as usual
onNavigate(data.user.isAdmin ? 'admin-dashboard' : 'home');
