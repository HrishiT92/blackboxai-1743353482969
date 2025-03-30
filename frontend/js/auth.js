// Auth related functionality
class Auth {
    constructor() {
        this.baseUrl = 'http://localhost:8000/api';
        this.tokenKey = 'jira_token';
        this.userKey = 'jira_user';
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            this.setToken(data.token);
            this.setUser(data.user);

            // Show success message
            this.showAlert('Login successful! Redirecting...', 'success');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);

        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;

        console.log('Registration form data:', { username, email, role });

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match', 'error');
            return;
        }

        // Validate role is selected
        if (!role || role === "") {
            this.showAlert('Please select a role', 'error');
            return;
        }

        // Log the selected role
        console.log('Selected role:', role);

        try {
            console.log('Sending registration request to:', `${this.baseUrl}/register`);
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, role })
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Store token and user data
            this.setToken(data.token);
            this.setUser(data.user);

            // Show success message
            this.showAlert('Registration successful! Redirecting...', 'success');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);

        } catch (error) {
            this.showAlert(error.message, 'error');
        }
    }

    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        window.location.href = '/login.html';
    }

    showAlert(message, type = 'success') {
        const alert = document.getElementById('alert');
        const alertMessage = document.getElementById('alertMessage');

        alert.className = 'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg';
        
        if (type === 'success') {
            alert.classList.add('bg-green-100', 'text-green-700');
        } else {
            alert.classList.add('bg-red-100', 'text-red-700');
        }

        alertMessage.textContent = message;
        alert.classList.remove('hidden');

        // Hide alert after 3 seconds
        setTimeout(() => {
            alert.classList.add('hidden');
        }, 3000);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }

    // Middleware to protect routes
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
}

// Initialize auth
const auth = new Auth();

// Protect routes except login and register pages
if (!window.location.pathname.includes('login.html') && 
    !window.location.pathname.includes('register.html')) {
    auth.requireAuth();
}