// explore.js
document.addEventListener('DOMContentLoaded', () => {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check URL params for global search
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    const searchInput = document.getElementById('page-search');
    const sortFilter = document.getElementById('sort-filter');
    
    if (query && searchInput) {
        searchInput.value = query;
    }

    function renderUsers() {
        const container = document.getElementById('explore-grid');
        const noResults = document.getElementById('no-results');
        if (!container) return;

        const searchTerm = searchInput.value.toLowerCase();
        const sortBy = sortFilter.value;

        let filteredUsers = users.filter(user => {
            const matchName = user.name.toLowerCase().includes(searchTerm);
            const matchSkills = user.skills.some(skill => skill.toLowerCase().includes(searchTerm));
            return matchName || matchSkills;
        });

        if (sortBy === 'rating') {
            filteredUsers.sort((a, b) => b.rating - a.rating);
        } else {
            // Newest (mock by ID descending)
            filteredUsers.sort((a, b) => b.id - a.id);
        }

        if (filteredUsers.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
            let html = '';
            filteredUsers.forEach(user => {
                html += `
                    <div class="card text-center transition">
                        <img src="${user.avatar}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; object-fit: cover;">
                        <h3>${user.name}</h3>
                        <p class="text-secondary mb-2">${user.title}</p>
                        <div class="mb-4" style="color: #fbbf24;">
                            <i class="fas fa-star"></i> ${user.rating} (${user.ratingCount})
                        </div>
                        <a href="profile.html?id=${user.id}" class="btn btn-outline w-full">View Profile</a>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }

    if (searchInput) searchInput.addEventListener('input', renderUsers);
    if (sortFilter) sortFilter.addEventListener('change', renderUsers);

    renderUsers();
});
