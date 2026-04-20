// main.js - Shared logic

// --- Mock Data Initialization ---
const defaultUsers = [
    {
        id: 1,
        name: "John Doe",
        title: "Frontend Developer",
        email: "john@example.com",
        phone: "+1 234 567 890",
        bio: "Passionate frontend developer specializing in React and modern UI/UX.",
        avatar: "https://i.pravatar.cc/150?img=11",
        skills: ["HTML", "CSS", "JavaScript", "React"],
        experience: [{ role: "UI Engineer", company: "TechCorp", years: "2020-Present" }],
        education: [{ degree: "B.S. Computer Science", school: "State University", year: "2019" }],
        rating: 4.5,
        ratingCount: 12,
        projects: [
            { id: 101, title: "E-commerce App", desc: "A full-stack shop.", link: "#" },
            { id: 102, title: "Portfolio Theme", desc: "Responsive template.", link: "#" }
        ],
        comments: [
            { id: 1, author: "Jane Smith", text: "Great developer, amazing UI skills!", date: "2026-01-10" }
        ]
    },
    {
        id: 2,
        name: "Jane Smith",
        title: "UI/UX Designer",
        email: "jane@example.com",
        phone: "+1 987 654 321",
        bio: "Creative designer focused on minimalist and functional aesthetics.",
        avatar: "https://i.pravatar.cc/150?img=5",
        skills: ["Figma", "Sketch", "CSS", "Design Systems"],
        experience: [{ role: "Lead Designer", company: "DesignStudio", years: "2018-Present" }],
        education: [{ degree: "B.F.A. Design", school: "Art Institute", year: "2018" }],
        rating: 4.8,
        ratingCount: 20,
        projects: [
            { id: 201, title: "Fintech Dashboard UI", desc: "Clean admin panel.", link: "#" }
        ],
        comments: []
    }
];

if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}

// Current logged in user state
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('#theme-icon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }
}

// --- Sidebar & Navbar Logic ---
function initSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
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

    // Highlight active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

function initNavbar() {
    const userMenu = document.getElementById('user-menu');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenu && userDropdown) {
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        window.addEventListener('click', () => {
            if (userDropdown.classList.contains('show')) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Update greeting and avatar if logged in
    const greeting = document.getElementById('user-greeting');
    const avatar = document.getElementById('nav-avatar');

    if (currentUser) {
        if (greeting) greeting.textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
        if (avatar) avatar.src = currentUser.avatar || 'https://i.pravatar.cc/150?img=3';

        // Setup logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }
    } else {
        // Not logged in UI logic
        const authLinks = document.getElementById('auth-links');
        const userSection = document.getElementById('user-menu-section');
        if (authLinks && userSection) {
            authLinks.style.display = 'flex';
            userSection.style.display = 'none';
        }
    }
}

// --- Notifications System ---
function showNotification(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const notif = document.createElement('div');
    notif.className = `notification ${type}`;

    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    notif.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Global search handler
function initGlobalSearch() {
    const searchForm = document.getElementById('global-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchForm.querySelector('input').value;
            window.location.href = `explore.html?q=${encodeURIComponent(query)}`;
        });
    }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initNavbar();
    initGlobalSearch();

    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
});
