// explore.js
document.addEventListener('DOMContentLoaded', () => {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check URL params for global search
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    const searchInput = document.getElementById('page-search');
    const sortFilter = document.getElementById('sort-filter');
    const typeFilter = document.getElementById('type-filter');
    
    if (query && searchInput) {
        searchInput.value = query;
    }

    function renderUsers() {
        const container = document.getElementById('explore-grid');
        const noResults = document.getElementById('no-results');
        if (!container) return;

        const searchTerm = searchInput.value.toLowerCase();
        const sortBy = sortFilter.value;
        const filterType = typeFilter ? typeFilter.value : 'all';

        let filteredUsers = users.filter(user => {
            // Type Filter
            if (filterType !== 'all' && user.role !== filterType) {
                // If the user role is undefined, it defaults to individual
                if (!(filterType === 'individual' && !user.role)) return false;
            }

            const matchName = user.name.toLowerCase().includes(searchTerm);
            
            let matchContent = false;
            if (user.role === 'company') {
                const matchBranches = user.branches?.some(b => b.location.toLowerCase().includes(searchTerm) || b.name.toLowerCase().includes(searchTerm));
                const matchDesc = user.bio?.toLowerCase().includes(searchTerm);
                matchContent = matchBranches || matchDesc;
            } else {
                matchContent = user.skills?.some(skill => skill.toLowerCase().includes(searchTerm));
            }
            
            return matchName || matchContent;
        });

        if (sortBy === 'rating') {
            filteredUsers.sort((a, b) => (b.rating || 0) - (a.rating || 0));
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
                const isCompany = user.role === 'company';
                const badgeHtml = isCompany ? '<span class="badge badge-company absolute top-2 right-2">Company</span>' : '<span class="badge badge-user absolute top-2 right-2">Individual</span>';
                
                html += `
                    <div class="card card-3d text-center relative">
                        ${badgeHtml}
                        <img src="${user.avatar}" alt="${user.name}" style="width: 80px; height: 80px; border-radius: 50%; margin: 15px auto 15px; object-fit: cover; border: 3px solid var(--border-color);">
                        <h3>${user.name}</h3>
                        <p class="text-secondary mb-2" style="min-height: 48px;">${user.title || ''}</p>
                        <div class="mb-4" style="color: #fbbf24;">
                            <i class="fas fa-star"></i> ${(user.rating || 0).toFixed(1)} (${user.ratingCount || 0})
                        </div>
                        <div class="flex gap-2">
                            <a href="profile.html?id=${user.id}" class="btn btn-primary flex-1 text-sm py-2">View Profile</a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }

    if (searchInput) searchInput.addEventListener('input', renderUsers);
    if (sortFilter) sortFilter.addEventListener('change', renderUsers);
    if (typeFilter) typeFilter.addEventListener('change', renderUsers);

    renderUsers();
});
