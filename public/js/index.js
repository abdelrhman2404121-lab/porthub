// public/js/index.js — Landing / Home page
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    // Redirect logged-in users away from the landing page
    if (isLoggedIn()) {
        const user = getCurrentUser();
        if (user && user.role === 'admin') {
            window.location.href = '/admin.html';
        } else if (user) {
            window.location.href = '/dashboard.html';
        }
        return;
    }

    // Load latest users for homepage showcase (public, no auth)
    const showcaseEl = document.getElementById('home-showcase');
    if (!showcaseEl) return;

    try {
        const data  = await apiFetch('/users?limit=6&sort=rating');
        const users = data.users || [];

        showcaseEl.innerHTML = users.length ? users.map(u => {
            const avatar    = u.profileImage || `https://i.pravatar.cc/150?u=${u.email}`;
            const isCompany = u.role === 'company';
            return `
                <div class="card text-center">
                    <img src="${avatar}" alt="${u.name}" style="width:70px;height:70px;border-radius:50%;margin:0 auto 10px;object-fit:cover;border:3px solid var(--border-color);">
                    <h4>${u.name}</h4>
                    <p class="text-secondary text-sm mb-2">${u.title || (isCompany ? 'Company' : 'Member')}</p>
                    <div style="color:#fbbf24;font-size:0.85rem;margin-bottom:10px;">
                        <i class="fas fa-star"></i> ${(u.rating || 0).toFixed(1)}
                    </div>
                    <a href="/profile.html?id=${u._id}" class="btn btn-outline" style="padding:5px 12px;font-size:0.8rem;">View Profile</a>
                </div>`;
        }).join('') : '<p class="text-secondary">No users yet.</p>';
    } catch {
        // Silently fail — homepage showcase is non-critical
    }
});
