/**
 * WELCOME MOTOR - Admin Authentication Guard & Session Controller
 * Private Admin Access ONLY (No Public Registration)
 */

const AUTH_CONFIG = {
  sessionKey: 'welcome_motor_admin_token',
  userKey: 'welcome_motor_admin_user',
  
  // Authorized Staff / Owner Accounts
  credentials: [
    { email: 'arslan@welcomemotor.pk', pass: 'arslan17', name: 'Arslan Farooq (Owner)' },
    { email: 'admin@welcomemotor.pk', pass: 'welcome2026', name: 'Welcome Motor Admin' },
    { email: 'admin', pass: 'admin123', name: 'Showroom Staff' }
  ]
};

class AdminAuth {
  static isAuthenticated() {
    const token = localStorage.getItem(AUTH_CONFIG.sessionKey);
    return Boolean(token);
  }

  static getCurrentUser() {
    const user = localStorage.getItem(AUTH_CONFIG.userKey);
    try {
      return user ? JSON.parse(user) : { name: 'Showroom Admin', email: 'admin@welcomemotor.pk' };
    } catch (e) {
      return { name: 'Showroom Admin' };
    }
  }

  static async login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Try Supabase Auth first if available
    if (window.supabase && window.APP_CONFIG?.supabase?.url) {
      try {
        const client = window.supabase.createClient(
          window.APP_CONFIG.supabase.url,
          window.APP_CONFIG.supabase.anonKey
        );
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanId,
          password: cleanPass
        });

        if (!error && data?.session) {
          localStorage.setItem(AUTH_CONFIG.sessionKey, data.session.access_token);
          localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify({
            name: 'Authorized Admin',
            email: data.user.email
          }));
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase auth check:', err.message);
      }
    }

    // 2. Master Credentials Check
    const matched = AUTH_CONFIG.credentials.find(
      c => (c.email.toLowerCase() === cleanId) && c.pass === cleanPass
    );

    if (matched) {
      const mockToken = 'wm_auth_' + Date.now() + '_' + Math.random().toString(36).substring(2);
      localStorage.setItem(AUTH_CONFIG.sessionKey, mockToken);
      localStorage.setItem(AUTH_CONFIG.userKey, JSON.stringify({
        name: matched.name,
        email: matched.email
      }));
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials. Please verify your login details.' };
  }

  static logout() {
    localStorage.removeItem(AUTH_CONFIG.sessionKey);
    localStorage.removeItem(AUTH_CONFIG.userKey);
    window.location.href = 'login.html';
  }

  static enforceAuth() {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const auth = this.isAuthenticated();

    if (!auth && !isLoginPage) {
      window.location.href = 'login.html';
    } else if (auth && isLoginPage) {
      window.location.href = 'index.html';
    }
  }
}

// Auto run auth check on load
if (typeof window !== 'undefined') {
  window.AdminAuth = AdminAuth;
  AdminAuth.enforceAuth();
}
