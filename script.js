'use strict';

/**
 * LokLagbo front-end logic (hardened)
 * - Home: buttons handled by HTML links
 * - Login: role inferred from stored user
 * - Signup: two forms (hirer / worker)
 * - Dashboard: role-based rendering; logout supported
 * - Storage: localStorage key "users" holds map of { email: { role, name } }
 */

/* -------------------- Constants & utils -------------------- */
const VALID_ROLES = new Set(['hirer', 'worker']);

function isPlainObject(x) {
  if (x === null || typeof x !== 'object') return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}

function normalizeEmail(email) {
  return (email || '').toString().trim().toLowerCase();
}

function isValidEmail(email) {
  // Simple, permissive email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
}

function safeRedirect(url) {
  try {
    window.location.href = url;
  } catch {
    // ignore
  }
}

/* -------------------- Storage helpers -------------------- */
function sanitizeUsers(obj) {
  if (!isPlainObject(obj)) return {};
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    const email = normalizeEmail(key);
    if (!isValidEmail(email)) continue;
    if (!isPlainObject(val)) continue;

    const role = typeof val.role === 'string' ? val.role.trim().toLowerCase() : '';
    const name = typeof val.name === 'string' ? val.name : '';

    if (!VALID_ROLES.has(role)) continue;
    clean[email] = { role, name };
  }
  return clean;
}

function getUsers() {
  try {
    const raw = localStorage.getItem('users');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return sanitizeUsers(parsed);
  } catch {
    return {};
  }
}

function setUsers(users) {
  try {
    const safe = sanitizeUsers(users);
    localStorage.setItem('users', JSON.stringify(safe));
  } catch {
    // Fail silently; app can still function in-memory.
  }
}

function setCurrentUser(email) {
  try {
    localStorage.setItem('currentUser', normalizeEmail(email));
  } catch {
    // ignore
  }
}

function getCurrentUser() {
  try {
    return localStorage.getItem('currentUser');
  } catch {
    return null;
  }
}

function clearCurrentUser() {
  try {
    localStorage.removeItem('currentUser');
  } catch {
    // ignore
  }
}

/* -------------------- DOM Ready wiring -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // LOGIN PAGE
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const emailInput = document.getElementById('login-email');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = normalizeEmail(emailInput ? emailInput.value : '');
      if (!email) {
        alert('Please enter your email.');
        return;
      }
      if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      const users = getUsers();
      const user = users[email];

      if (!user) {
        alert('No account found for this email. Please sign up first.');
        return;
      }

      setCurrentUser(email);
      safeRedirect('dashboard.html');
    });
  }

  // SIGNUP PAGE - HIRER
  const hirerForm = document.getElementById('hirer-signup-form');
  if (hirerForm) {
    const hirerNameEl = document.getElementById('hirer-name');
    const hirerEmailEl = document.getElementById('hirer-email');

    hirerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (hirerNameEl ? hirerNameEl.value : '').trim();
      const email = normalizeEmail(hirerEmailEl ? hirerEmailEl.value : '');

      if (!name || !email) {
        alert('Please fill in both name and email.');
        return;
      }
      if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      const users = getUsers();
      if (users[email]) {
        alert('An account with this email already exists. Please log in instead.');
        safeRedirect('login.html');
        return;
      }

      users[email] = { role: 'hirer', name };
      setUsers(users);
      setCurrentUser(email);

      safeRedirect('dashboard.html');
    });
  }

  // SIGNUP PAGE - WORKER
  const workerForm = document.getElementById('worker-signup-form');
  if (workerForm) {
    const workerNameEl = document.getElementById('worker-name');
    const workerEmailEl = document.getElementById('worker-email');

    workerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = (workerNameEl ? workerNameEl.value : '').trim();
      const email = normalizeEmail(workerEmailEl ? workerEmailEl.value : '');

      if (!name || !email) {
        alert('Please fill in both name and email.');
        return;
      }
      if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      const users = getUsers();
      if (users[email]) {
        alert('An account with this email already exists. Please log in instead.');
        safeRedirect('login.html');
        return;
      }

      users[email] = { role: 'worker', name };
      setUsers(users);
      setCurrentUser(email);

      safeRedirect('dashboard.html');
    });
  }

  // DASHBOARD PAGE
  const dashboardContent = document.getElementById('dashboard-content');
  const logoutBtn = document.getElementById('logout-btn');
  const welcomeHeading = document.getElementById('welcome-heading');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearCurrentUser();
      safeRedirect('index.html');
    });
  }

  if (dashboardContent) {
    const currentEmail = normalizeEmail(getCurrentUser());
    const users = getUsers();
    const user = users[currentEmail];

    if (!currentEmail || !user) {
      // Not logged in or user missing -> send to login
      clearCurrentUser();
      safeRedirect('login.html');
      return;
    }

    const firstName = ((user.name || '').trim().split(/\s+/)[0]) || 'there';
    if (welcomeHeading) {
      welcomeHeading.textContent = `Welcome, ${firstName}!`;
    }

    if (user.role === 'hirer') {
      dashboardContent.innerHTML = `
        <section class="card">
          <h3>Explore Our Services</h3>
          <p class="muted">Find trusted help for your home and business.</p>
          <div class="service-grid">
            <div class="service-card">🧹 Cleaning</div>
            <div class="service-card">🧑‍🍳 Cooking</div>
            <div class="service-card">🚗 Driving</div>
            <div class="service-card">🛠️ Plumbing</div>
            <div class="service-card">🔌 Electrician</div>
            <div class="service-card">🧕 House Help</div>
            <div class="service-card">🛡️ Security</div>
            <div class="service-card">📦 Task Runner</div>
          </div>
        </section>
      `;
    } else if (user.role === 'worker') {
      dashboardContent.innerHTML = `
        <section class="card">
          <h3>Welcome, Worker</h3>
          <p class="muted">Set up your profile and start receiving job offers.</p>
          <ul>
            <li>Add your skills and availability</li>
            <li>Get rated by hirers and grow your reputation</li>
          </ul>
        </section>
      `;
    } else {
      dashboardContent.innerHTML = `
        <section class="card">
          <p>We couldn't determine your role. Please log in again.</p>
        </section>
      `;
    }
  }
});
