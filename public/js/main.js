// public/js/main.js — Shared API helper, theme, sidebar, navbar
'use strict';

// ─── API Configuration ────────────────────────────────────────────────────────
const API_BASE = '/api';

/**
 * Central fetch wrapper — adds JWT header automatically, handles errors.
 * Returns { success, data } or throws on network failure.
 */
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // If 401, clear session and redirect to login
        if (res.status === 401) {
            clearSession();
            if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register') && !window.location.pathname.includes('index')) {
                window.location.href = '/login.html';
            }
        }
        throw { status: res.status, message: data.message || 'Request failed' };
    }
    return data;
}

// ─── Session helpers ──────────────────────────────────────────────────────────
function getToken()       { return localStorage.getItem('token'); }
function getCurrentUser() { try { return JSON.parse(localStorage.getItem('currentUser')) || null; } catch { return null; } }
function isLoggedIn()     { return !!getToken() && !!getCurrentUser(); }

function setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
}

// ─── Format last seen ─────────────────────────────────────────────────────────
function formatLastSeen(dateStr) {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now   = new Date();
    const diff  = Math.floor((now - date) / 1000); // seconds

    if (diff < 60)   return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
}

// ─── Theme Management ─────────────────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-icon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function initSidebar() {
    const menuToggle  = document.getElementById('menu-toggle');
    const sidebar     = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('expanded');
            }
        });
    }

    // Highlight active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPage) link.classList.add('active');
    });
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function initNavbar() {
    const userMenu     = document.getElementById('user-menu');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenu && userDropdown) {
        userMenu.addEventListener('click', e => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        window.addEventListener('click', () => userDropdown.classList.remove('show'));
    }

    const currentUser = getCurrentUser();
    const greeting    = document.getElementById('user-greeting');
    const avatar      = document.getElementById('nav-avatar');

    if (currentUser) {
        if (greeting) greeting.textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
        if (avatar)   avatar.src = currentUser.profileImage || `https://i.pravatar.cc/150?u=${currentUser.email}`;

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async e => {
                e.preventDefault();
                try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
                clearSession();
                window.location.href = '/login.html';
            });
        }

        // Notification badge
        if (currentUser.notifications) {
            const hasUnread = currentUser.notifications.some(n => !n.read);
            const badge     = document.getElementById('nav-notif-badge');
            if (badge && hasUnread) badge.style.display = 'block';
        }
    } else {
        const authLinks   = document.getElementById('auth-links');
        const userSection = document.getElementById('user-menu-section');
        if (authLinks)   authLinks.style.display   = 'flex';
        if (userSection) userSection.style.display = 'none';
    }
}

// ─── Global Search ────────────────────────────────────────────────────────────
function initGlobalSearch() {
    const form = document.getElementById('global-search-form');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const q = form.querySelector('input').value.trim();
            if (q) window.location.href = `/explore.html?q=${encodeURIComponent(q)}`;
        });
    }
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id        = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const notif   = document.createElement('div');
    notif.className = `notification ${type}`;
    const icon      = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    notif.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => notif.remove(), 400);
    }, 3500);
}

// ─── Ripple effect on buttons ─────────────────────────────────────────────────
function initRipple() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn || btn.disabled) return;
        const ripple = document.createElement('span');
        const rect   = btn.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height);
        ripple.className = 'ripple';
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px;`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    });
}

// ─── Navbar scroll shadow ─────────────────────────────────────────────────────
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
}

// ─── Auto-highlight active sidebar link ───────────────────────────────────────
function initActiveSidebarLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        const href = (a.getAttribute('href') || '').split('?')[0].split('/').pop();
        if (href && currentPath.startsWith(href.replace('.html', ''))) {
            a.classList.add('active');
        } else {
            a.classList.remove('active');
        }
    });
}

// ─── Init on DOM ready ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initNavbar();
    initGlobalSearch();
    initRipple();
    initNavbarScroll();
    initActiveSidebarLink();

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
});

