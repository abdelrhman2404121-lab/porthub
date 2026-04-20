// index.js

document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedUsers();
});

function loadFeaturedUsers() {
    const container = document.getElementById('featured-users');
    if (!container) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Sort by rating descending and take top 3
    const topUsers = users.sort((a, b) => b.rating - a.rating).slice(0, 3);
    
    if (topUsers.length === 0) {
        container.innerHTML = '<p>No users found.</p>';
        return;
    }

    let html = '';
    topUsers.forEach(user => {
        html += `
            <div class="card text-center transition">
                <img src="${user.avatar}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; object-fit: cover;">
                <h3>${user.name}</h3>
                <p class="text-secondary mb-2">${user.title}</p>
                <div class="mb-4" style="color: #fbbf24;">
                    <i class="fas fa-star"></i> ${user.rating} (${user.ratingCount} reviews)
                </div>
                <div class="flex justify-center gap-2 mb-4" style="flex-wrap: wrap;">
                    ${user.skills.slice(0, 3).map(skill => `<span style="font-size: 0.75rem; padding: 4px 8px; background: var(--bg-color); border-radius: 4px; color: var(--primary-color);">${skill}</span>`).join('')}
                </div>
                <a href="profile.html?id=${user.id}" class="btn btn-outline w-full">View Profile</a>
            </div>
        `;
    });

    container.innerHTML = html;
}
