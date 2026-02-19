// Main JavaScript - Common functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Update navigation based on auth status
    updateNavigation();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const target = document.querySelector(href);
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                if (navMenu) {
                    navMenu.classList.remove('active');
                }
            }
        });
    });
});

// Auth helper functions
function isLoggedIn() {
    return localStorage.getItem('user') !== null;
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function updateNavigation() {
    const navAuthLink = document.getElementById('navAuthLink');
    
    if (!navAuthLink) return;
    
    if (isLoggedIn()) {
        const user = getCurrentUser();
        navAuthLink.textContent = user.name;
        navAuthLink.href = 'dashboard.html';
        
        // Add logout option
        const logoutLink = document.createElement('li');
        logoutLink.innerHTML = '<a href="#" id="logoutLink"><i class="fas fa-sign-out-alt"></i> 로그아웃</a>';
        navAuthLink.parentElement.parentElement.appendChild(logoutLink);
        
        document.getElementById('logoutLink').addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('로그아웃 하시겠습니까?')) {
                logout();
            }
        });
    } else {
        navAuthLink.textContent = '로그인';
        navAuthLink.href = 'login.html';
    }
}

// API helper functions
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(endpoint, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        // For DELETE requests that return 204 No Content
        if (response.status === 204) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(amount);
}

function showMessage(elementId, message, type = 'success') {
    const messageBox = document.getElementById(elementId);
    if (!messageBox) return;
    
    messageBox.textContent = message;
    messageBox.className = `message-box ${type}`;
    messageBox.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}

function hideMessage(elementId) {
    const messageBox = document.getElementById(elementId);
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

// Hash password (simple implementation - in production use proper hashing)
function hashPassword(password) {
    // This is a simple hash for demonstration
    // In production, use a proper server-side hashing algorithm
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Setup modal close handlers
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking on close button
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
});