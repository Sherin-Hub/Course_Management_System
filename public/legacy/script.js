/* ==========================================================================
   LMS Portal — Application Script
   Organized as small, reusable modules on the LMS namespace:
     LMS.Storage    -> localStorage-backed persistence layer
     LMS.Validate   -> field validators, reused by every form
     LMS.UI         -> toasts, password toggles, password-strength meter
     LMS.Nav        -> dynamic navigation + route protection
     LMS.Auth       -> register / login / logout / password reset
     LMS.Dashboard  -> renders stats, courses, and activity
   Every module is self-contained so it can be reused on any page;
   main() at the bottom wires up only what the current page needs.
   ========================================================================== */

const LMS = (() => {

  /* ------------------------------------------------------------------ *
   * Storage — all persistence lives here. Swapping localStorage for a
   * real backend later means only touching this module.
   * ------------------------------------------------------------------ */
  const Storage = (() => {
    const USERS_KEY = 'lms_users';
    const SESSION_KEY = 'lms_session';
    const RESET_KEY = 'lms_reset_flow';

    function readJSON(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        console.warn(`LMS.Storage: could not parse "${key}"`, e);
        return fallback;
      }
    }
    function writeJSON(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    // NOTE: this is a client-only demo. Passwords are lightly obfuscated
    // (not hashed) purely so they aren't sitting in localStorage as plain
    // text. A production build must hash + verify passwords server-side.
    function obfuscate(str) {
      return btoa(unescape(encodeURIComponent(str)));
    }

    return {
      getUsers() { return readJSON(USERS_KEY, []); },
      saveUsers(users) { writeJSON(USERS_KEY, users); },

      findUserByEmail(email) {
        return this.getUsers().find(
          u => u.email.toLowerCase() === String(email).toLowerCase()
        );
      },

      addUser({ name, email, phone, password, role }) {
        const users = this.getUsers();
        users.push({
          id: 'u_' + Date.now().toString(36),
          name, email: email.toLowerCase(), phone,
          password: obfuscate(password),
          role: role || 'student',
          createdAt: new Date().toISOString(),
        });
        this.saveUsers(users);
      },

      verifyPassword(user, password) {
        return user.password === obfuscate(password);
      },

      updatePassword(email, newPassword) {
        const users = this.getUsers();
        const u = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!u) return false;
        u.password = obfuscate(newPassword);
        this.saveUsers(users);
        return true;
      },

      setSession(email) { writeJSON(SESSION_KEY, { email, at: Date.now() }); },
      getSession() { return readJSON(SESSION_KEY, null); },
      clearSession() { localStorage.removeItem(SESSION_KEY); },

      getCurrentUser() {
        const session = this.getSession();
        if (!session) return null;
        return this.findUserByEmail(session.email) || null;
      },

      // Password-reset flow state (which email is mid-reset, demo OTP gate)
      setResetFlow(email) { writeJSON(RESET_KEY, { email, verified: false }); },
      getResetFlow() { return readJSON(RESET_KEY, null); },
      markResetVerified() {
        const flow = this.getResetFlow();
        if (flow) { flow.verified = true; writeJSON(RESET_KEY, flow); }
      },
      clearResetFlow() { localStorage.removeItem(RESET_KEY); },

      // Per-user course + activity data, generated once and then persisted
      getCourseData(email) {
        const key = `lms_courses_${email.toLowerCase()}`;
        let data = readJSON(key, null);
        if (!data) {
          data = seedCourseData(email);
          writeJSON(key, data);
        }
        return data;
      },
    };
  })();

  // Deterministic-ish demo data so a given account sees the same
  // dashboard every time they log back in.
  function seedCourseData(email) {
    const catalog = [
      { title: 'UI/UX Design Fundamentals', icon: '🎨', total: 24 },
      { title: 'JavaScript for Beginners', icon: '💻', total: 32 },
      { title: 'Data Analysis with Python', icon: '📊', total: 28 },
      { title: 'Digital Marketing Essentials', icon: '📣', total: 18 },
      { title: 'Project Management Basics', icon: '🗂️', total: 20 },
    ];
    let seed = 0;
    for (let i = 0; i < email.length; i++) seed += email.charCodeAt(i);
    const shuffled = [...catalog].sort((a, b) =>
      ((seed * (catalog.indexOf(a) + 1)) % 7) - ((seed * (catalog.indexOf(b) + 1)) % 7)
    );
    const enrolled = shuffled.slice(0, 3).map((c, i) => {
      const completedLessons = Math.max(1, Math.round(c.total * ((seed + i * 13) % 100) / 100));
      return {
        ...c,
        completedLessons,
        progress: Math.min(100, Math.round((completedLessons / c.total) * 100)),
      };
    });
    const activity = [
      { icon: '✅', text: `Completed a lesson in "${enrolled[0].title}"`, time: '2 hours ago' },
      { icon: '📜', text: 'Earned a certificate — nice work!', time: 'Yesterday' },
      { icon: '📝', text: `Started "${enrolled[1] ? enrolled[1].title : 'a new course'}"`, time: '3 days ago' },
    ];
    return { courses: enrolled, activity };
  }

  /* ------------------------------------------------------------------ *
   * Validate — pure functions, each returns '' (valid) or an error string.
   * Reused across register / login / forgot / reset forms.
   * ------------------------------------------------------------------ */
  const Validate = {
    required(value, label = 'This field') {
      return String(value || '').trim() ? '' : `${label} is required.`;
    },
    name(value) {
      const v = String(value || '').trim();
      if (!v) return 'Full name is required.';
      if (v.length < 2) return 'Name must be at least 2 characters.';
      if (!/^[A-Za-z\s.'-]+$/.test(v)) return 'Name can only contain letters and spaces.';
      return '';
    },
    email(value) {
      const v = String(value || '').trim();
      if (!v) return 'Email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
      return '';
    },
    phone(value) {
      const v = String(value || '').trim();
      if (!v) return 'Mobile number is required.';
      if (!/^[6-9]\d{9}$/.test(v)) return 'Enter a valid 10-digit mobile number.';
      return '';
    },
    password(value) {
      const v = String(value || '');
      if (!v) return 'Password is required.';
      if (v.length < 8) return 'Password must be at least 8 characters.';
      return '';
    },
    confirm(value, original) {
      if (!value) return 'Please confirm your password.';
      if (value !== original) return 'Passwords do not match.';
      return '';
    },
    strength(value) {
      let score = 0;
      if (value.length >= 8) score++;
      if (value.length >= 12) score++;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
      if (/\d/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;
      const levels = [
        { label: '', pct: 0, color: 'var(--border)' },
        { label: 'Weak', pct: 25, color: 'var(--danger)' },
        { label: 'Fair', pct: 50, color: 'var(--amber)' },
        { label: 'Good', pct: 75, color: 'var(--blue)' },
        { label: 'Strong', pct: 100, color: 'var(--success)' },
      ];
      const idx = value ? Math.min(4, Math.max(1, score)) : 0;
      return levels[idx];
    },
  };

  /* Attach live + submit-time validation to a form declaratively. */
  function bindForm(formEl, rules, onValid) {
    if (!formEl) return;
    const fieldFor = id => document.getElementById(id);
    const errFor = id => fieldFor(id)?.parentElement.querySelector('.err-msg');

    function validateField(id) {
      const input = fieldFor(id);
      if (!input) return true;
      const rule = rules[id];
      const message = rule(input.value, formEl) || '';
      const err = errFor(id);
      if (err) err.textContent = message;
      input.classList.toggle('invalid', !!message);
      input.classList.toggle('valid', !message && input.value.trim() !== '');
      return !message;
    }

    Object.keys(rules).forEach(id => {
      const input = fieldFor(id);
      if (!input) return;
      input.addEventListener('blur', () => validateField(id));
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) validateField(id);
      });
    });

    formEl.addEventListener('submit', e => {
      e.preventDefault();
      const results = Object.keys(rules).map(validateField);
      const allValid = results.every(Boolean);
      if (allValid) onValid();
      else UI.toast('Please fix the highlighted fields.', 'error');
    });
  }

  /* ------------------------------------------------------------------ *
   * UI — small interactive helpers shared by every page.
   * ------------------------------------------------------------------ */
  const UI = {
    toast(message, type = 'info') {
      let stack = document.getElementById('toastStack');
      if (!stack) {
        stack = document.createElement('div');
        stack.id = 'toastStack';
        document.body.appendChild(stack);
      }
      const icon = { success: '✅', error: '⚠️', info: 'ℹ️' }[type] || 'ℹ️';
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
      stack.appendChild(el);
      setTimeout(() => {
        el.classList.add('leaving');
        setTimeout(() => el.remove(), 220);
      }, 3200);
    },

    bindPasswordToggles(scope = document) {
      scope.querySelectorAll('.toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = btn.previousElementSibling;
          if (!input) return;
          const show = input.type === 'password';
          input.type = show ? 'text' : 'password';
          btn.textContent = show ? '🙈' : '👁';
          btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
      });
    },

    bindStrengthMeter(inputId, fillId, labelId) {
      const input = document.getElementById(inputId);
      const fill = document.getElementById(fillId);
      const label = document.getElementById(labelId);
      if (!input || !fill || !label) return;
      input.addEventListener('input', () => {
        const s = Validate.strength(input.value);
        fill.style.width = s.pct + '%';
        fill.style.background = s.color;
        label.textContent = s.label;
        label.style.color = s.color;
      });
    },

    bindOtpBoxes(containerSelector) {
      const boxes = Array.from(document.querySelectorAll(`${containerSelector} .otp-box`));
      boxes.forEach((box, i) => {
        box.addEventListener('input', () => {
          box.value = box.value.replace(/\D/g, '').slice(0, 1);
          box.classList.toggle('filled', !!box.value);
          if (box.value && boxes[i + 1]) boxes[i + 1].focus();
        });
        box.addEventListener('keydown', e => {
          if (e.key === 'Backspace' && !box.value && boxes[i - 1]) {
            boxes[i - 1].focus();
          }
        });
        box.addEventListener('paste', e => {
          const digits = (e.clipboardData.getData('text').match(/\d/g) || []).slice(0, boxes.length);
          if (!digits.length) return;
          e.preventDefault();
          digits.forEach((d, idx) => { if (boxes[idx]) { boxes[idx].value = d; boxes[idx].classList.add('filled'); } });
          (boxes[digits.length] || boxes[boxes.length - 1]).focus();
        });
      });
      return () => boxes.map(b => b.value).join('');
    },

    greeting() {
      const h = new Date().getHours();
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      return 'Good evening';
    },

    initials(name) {
      return String(name || '?')
        .trim().split(/\s+/).slice(0, 2)
        .map(p => p[0]?.toUpperCase() || '').join('') || '?';
    },
  };

  /* ------------------------------------------------------------------ *
   * Nav — swaps links based on auth state, protects the dashboard route.
   * ------------------------------------------------------------------ */
  const Nav = {
    guardDashboard() {
      const page = location.pathname.split('/').pop();
      if (page === 'dashboard.html' && !Storage.getCurrentUser()) {
        location.replace('login.html');
        return true;
      }
      return false;
    },

    syncLinks() {
      const links = document.querySelector('.nav-links');
      if (!links) return;
      const user = Storage.getCurrentUser();
      const page = location.pathname.split('/').pop();
      if (page === 'dashboard.html') return; // dashboard nav is intentionally minimal

      if (user) {
        links.innerHTML = `
          <li><a href="index.html">Home</a></li>
          <li><a href="dashboard.html" class="nav-btn nav-primary">Dashboard</a></li>
        `;
      }
      // Logged-out state: leave the page's own markup (Home/Register/Login) as-is.
    },
  };

  /* ------------------------------------------------------------------ *
   * Auth — register, login, logout, forgot/reset password.
   * ------------------------------------------------------------------ */
  const Auth = {
    register({ name, email, phone, password, role }) {
      if (Storage.findUserByEmail(email)) {
        return { ok: false, message: 'An account with this email already exists.' };
      }
      Storage.addUser({ name, email, phone, password, role });
      Storage.setSession(email);
      return { ok: true };
    },

    login({ email, password }) {
      const user = Storage.findUserByEmail(email);
      if (!user) return { ok: false, message: 'No account found with that email. Try registering first.' };
      if (!Storage.verifyPassword(user, password)) {
        return { ok: false, message: 'Incorrect password. Please try again.' };
      }
      Storage.setSession(email);
      return { ok: true };
    },

    logout() {
      Storage.clearSession();
    },

    requestReset(email) {
      const user = Storage.findUserByEmail(email);
      if (!user) return { ok: false, message: 'No account is registered with that email.' };
      Storage.setResetFlow(email);
      return { ok: true };
    },

    verifyOtp(code) {
      // Demo OTP — see the hint on the forgot-password page.
      if (code === '123456') {
        Storage.markResetVerified();
        return { ok: true };
      }
      return { ok: false, message: 'Incorrect code. The demo code is 123456.' };
    },

    completeReset(newPassword) {
      const flow = Storage.getResetFlow();
      if (!flow || !flow.verified) {
        return { ok: false, message: 'Please verify your code first.' };
      }
      Storage.updatePassword(flow.email, newPassword);
      Storage.clearResetFlow();
      return { ok: true };
    },
  };

  /* ------------------------------------------------------------------ *
   * Dashboard — renders stats, course list, and activity for the user.
   * ------------------------------------------------------------------ */
  const Dashboard = {
    progressRingSVG(pct, size = 46) {
      const r = (size - 6) / 2;
      const c = 2 * Math.PI * r;
      const offset = c - (pct / 100) * c;
      const color = pct >= 75 ? 'var(--success)' : pct >= 40 ? 'var(--blue)' : 'var(--amber)';
      return `
        <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="4" />
          <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="4"
                  stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
                  transform="rotate(-90 ${size / 2} ${size / 2})" />
          <text x="50%" y="53%" text-anchor="middle" font-size="11">${pct}%</text>
        </svg>`;
    },

    render(user) {
      const { courses, activity } = Storage.getCourseData(user.email);

      // Header + identity
      const nameEl = document.getElementById('dashUserName');
      const roleEl = document.getElementById('dashUserRole');
      const avatarEl = document.getElementById('dashAvatar');
      const greetEl = document.getElementById('dashGreeting');
      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = user.role;
      if (avatarEl) avatarEl.textContent = UI.initials(user.name);
      if (greetEl) greetEl.textContent = `${UI.greeting()}, ${user.name.split(' ')[0]} 👋`;

      // Stats
      const avgProgress = Math.round(
        courses.reduce((sum, c) => sum + c.progress, 0) / (courses.length || 1)
      );
      const completed = courses.filter(c => c.progress === 100).length;
      setText('statCourses', courses.length);
      setText('statCompleted', completed);
      setText('statProgress', avgProgress + '%');
      setText('statCerts', completed);

      // Course list
      const list = document.getElementById('courseList');
      if (list) {
        list.innerHTML = courses.length ? courses.map(c => `
          <div class="course-row">
            <div class="course-thumb">${c.icon}</div>
            <div class="course-info">
              <div class="course-title">${escapeHTML(c.title)}</div>
              <div class="course-meta">${c.completedLessons} of ${c.total} lessons complete</div>
            </div>
            ${this.progressRingSVG(c.progress)}
            <a href="#" class="course-cta" onclick="return false;">${c.progress === 100 ? 'Review' : 'Continue'}</a>
          </div>
        `).join('') : `<div class="empty-state">No courses yet — enroll in one to get started.</div>`;
      }

      // Activity feed
      const activityList = document.getElementById('activityList');
      if (activityList) {
        activityList.innerHTML = activity.length ? activity.map(a => `
          <div class="activity-row">
            <div class="activity-dot">${a.icon}</div>
            <div>
              <div class="activity-text">${escapeHTML(a.text)}</div>
              <div class="activity-time">${a.time}</div>
            </div>
          </div>
        `).join('') : `<div class="empty-state">No recent activity.</div>`;
      }
    },
  };

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { Storage, Validate, bindForm, UI, Nav, Auth, Dashboard };
})();

/* ==========================================================================
   Page wiring — each page only hooks up what it actually contains.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';

  if (LMS.Nav.guardDashboard()) return; // redirected to login, stop here
  LMS.Nav.syncLinks();
  LMS.UI.bindPasswordToggles();

  // Mobile nav toggle (progressive enhancement — safe no-op if absent)
  document.querySelector('.nav-toggle')?.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.toggle('open');
  });

  switch (page) {
    case 'register.html': return initRegisterPage();
    case 'login.html': return initLoginPage();
    case 'forgot-password.html': return initForgotPasswordPage();
    case 'reset-password.html': return initResetPasswordPage();
    case 'dashboard.html': return initDashboardPage();
    default: return; // index.html needs no extra wiring
  }
});

function initRegisterPage() {
  const roleInput = document.getElementById('roleInput');
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (roleInput) roleInput.value = tab.dataset.role;
    });
  });

  LMS.UI.bindStrengthMeter('regPassword', 'strengthFill', 'strengthLabel');

  const form = document.getElementById('registerForm');
  LMS.bindForm(form, {
    regName: v => LMS.Validate.name(v),
    regPhone: v => LMS.Validate.phone(v),
    regEmail: v => LMS.Validate.email(v),
    regPassword: v => LMS.Validate.password(v),
    regConfirm: v => LMS.Validate.confirm(v, document.getElementById('regPassword').value),
  }, () => {
    const result = LMS.Auth.register({
      name: document.getElementById('regName').value.trim(),
      email: document.getElementById('regEmail').value.trim(),
      phone: document.getElementById('regPhone').value.trim(),
      password: document.getElementById('regPassword').value,
      role: roleInput ? roleInput.value : 'student',
    });
    if (result.ok) {
      LMS.UI.toast('Account created! Redirecting to your dashboard…', 'success');
      setTimeout(() => (location.href = 'dashboard.html'), 900);
    } else {
      LMS.UI.toast(result.message, 'error');
      const err = document.getElementById('regEmail').parentElement.querySelector('.err-msg');
      if (err) err.textContent = result.message;
      document.getElementById('regEmail').classList.add('invalid');
    }
  });
}

function initLoginPage() {
  const form = document.getElementById('loginForm');
  LMS.bindForm(form, {
    loginEmail: v => LMS.Validate.email(v),
    loginPassword: v => LMS.Validate.required(v, 'Password'),
  }, () => {
    const result = LMS.Auth.login({
      email: document.getElementById('loginEmail').value.trim(),
      password: document.getElementById('loginPassword').value,
    });
    if (result.ok) {
      LMS.UI.toast('Welcome back! Redirecting…', 'success');
      setTimeout(() => (location.href = 'dashboard.html'), 700);
    } else {
      LMS.UI.toast(result.message, 'error');
      const err = document.getElementById('loginPassword').parentElement.querySelector('.err-msg');
      if (err) err.textContent = result.message;
      document.getElementById('loginPassword').classList.add('invalid');
    }
  });
}

function initForgotPasswordPage() {
  const form = document.getElementById('forgotForm');
  LMS.bindForm(form, {
    forgotEmail: v => LMS.Validate.email(v),
  }, () => {
    const email = document.getElementById('forgotEmail').value.trim();
    const result = LMS.Auth.requestReset(email);
    if (result.ok) {
      document.getElementById('step1dot')?.classList.add('done');
      document.getElementById('step2dot')?.classList.add('active');
      LMS.UI.toast('Reset code sent — check your inbox.', 'success');
      setTimeout(() => (location.href = 'reset-password.html'), 700);
    } else {
      LMS.UI.toast(result.message, 'error');
      const err = document.getElementById('forgotEmail').parentElement.querySelector('.err-msg');
      if (err) err.textContent = result.message;
      document.getElementById('forgotEmail').classList.add('invalid');
    }
  });
}

function initResetPasswordPage() {
  // If nobody started a "forgot password" flow, send them there instead.
  if (!LMS.Storage.getResetFlow()) {
    location.replace('forgot-password.html');
    return;
  }

  const getOtpValue = LMS.UI.bindOtpBoxes('.otp-row');
  LMS.UI.bindStrengthMeter('newPassword', 'strengthFill', 'strengthLabel');

  const form = document.getElementById('resetForm');
  LMS.bindForm(form, {
    newPassword: v => LMS.Validate.password(v),
    confirmNewPassword: v => LMS.Validate.confirm(v, document.getElementById('newPassword').value),
  }, () => {
    const otp = getOtpValue();
    const otpError = document.getElementById('otpError');
    if (otp.length < 6) {
      if (otpError) otpError.textContent = 'Enter all 6 digits of the code.';
      return;
    }
    const verify = LMS.Auth.verifyOtp(otp);
    if (!verify.ok) {
      if (otpError) otpError.textContent = verify.message;
      document.querySelectorAll('.otp-box').forEach(b => b.classList.add('invalid'));
      LMS.UI.toast(verify.message, 'error');
      return;
    }
    if (otpError) otpError.textContent = '';

    const result = LMS.Auth.completeReset(document.getElementById('newPassword').value);
    if (result.ok) {
      LMS.UI.toast('Password reset! Redirecting to login…', 'success');
      setTimeout(() => (location.href = 'login.html'), 800);
    } else {
      LMS.UI.toast(result.message, 'error');
    }
  });
}

function initDashboardPage() {
  const user = LMS.Storage.getCurrentUser();
  if (!user) { location.replace('login.html'); return; }
  LMS.Dashboard.render(user);

  document.getElementById('logoutLink')?.addEventListener('click', e => {
    e.preventDefault();
    LMS.Auth.logout();
    LMS.UI.toast('Logged out. See you soon!', 'info');
    setTimeout(() => (location.href = 'login.html'), 500);
  });
}
