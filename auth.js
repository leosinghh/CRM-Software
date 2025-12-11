// ----- Auth storage keys -----
const AUTH_KEYS = {
  USERS: "influenceflow_users",
  CURRENT_USER: "influenceflow_current_user",
};

// ----- Helpers -----
function loadAuthJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveAuthJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return loadAuthJSON(AUTH_KEYS.USERS, []);
}

function saveUsers(users) {
  saveAuthJSON(AUTH_KEYS.USERS, users);
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );
}

function getCurrentUser() {
  return loadAuthJSON(AUTH_KEYS.CURRENT_USER, null);
}

function setCurrentUser(user) {
  saveAuthJSON(AUTH_KEYS.CURRENT_USER, {
    fullName: user.fullName,
    email: user.email,
  });
}

function clearCurrentUser() {
  localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
}

// Seed a demo user on first load
function seedDemoUserIfNeeded() {
  const users = getUsers();
  if (!users.length) {
    users.push({
      fullName: "Demo Brand Manager",
      email: "demo@brand.com",
      password: "demo123",
    });
    saveUsers(users);
  }
}

// ----- Page-level auth guard -----
function requireAuthForAppPages() {
  const path = window.location.pathname || "";
  const onLoginPage =
    path.endsWith("login.html") || path.endsWith("/login") || path === "/";

  // Only guard index.html / app pages, not login.html
  if (!onLoginPage) {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
    }
  }
}

// ----- Hook up login / signup form (only if present) -----
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return; // Not on login page

  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorEl = document.getElementById("login-error");
  const signupBtn = document.getElementById("signup-button");

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.style.display = "none";
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!fullName || !email || !password) {
      showError("Please fill in all fields.");
      return;
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      showError("Invalid email or password.");
      return;
    }

    setCurrentUser(user);
    window.location.href = "index.html";
  });

  signupBtn.addEventListener("click", () => {
    clearError();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!fullName || !email || !password) {
      showError("Enter a name, email and password to create an account.");
      return;
    }

    const existing = findUserByEmail(email);
    if (existing) {
      showError("An account with this email already exists.");
      return;
    }

    const users = getUsers();
    const newUser = { fullName, email, password };
    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser);

    window.location.href = "index.html";
  });
}

// ----- Inject user info + logout on main app pages -----
function initAppUserHeader() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("account-name");
  const emailEl = document.getElementById("account-email");
  const logoutBtn = document.getElementById("logout-button");

  if (!user) return;

  if (nameEl) nameEl.textContent = user.fullName || "Logged in";
  if (emailEl) emailEl.textContent = user.email || "";

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearCurrentUser();
      window.location.href = "login.html";
    });
  }
}

// ----- Bootstrap -----
document.addEventListener("DOMContentLoaded", () => {
  seedDemoUserIfNeeded();
  requireAuthForAppPages();
  initLoginForm();
  initAppUserHeader();
});
