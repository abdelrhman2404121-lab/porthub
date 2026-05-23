// public/js/explore.js — Explore / Search users
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    const container   = document.getElementById('explore-grid');
    const noResults   = document.getElementById('no-results');
    const searchInput = document.getElementById('page-search');
    const sortFilter  = document.getElementById('sort-filter');
    const typeFilter  = document.getElementById('type-filter');

    // Pre-fill search from URL ?q=
    const urlParams = new URLSearchParams(window.location.search);
    const initQuery = urlParams.get('q') || '';
    if (searchInput && initQuery) searchInput.value = initQuery;

    let debounceTimer;

    async function fetchAndRender() {
        if (!container) return;

        const q    = searchInput ? searchInput.value.trim() : '';
        const sort = sortFilter  ? sortFilter.value : 'newest';
        const role = typeFilter  ? typeFilter.value : 'all';

        const params = new URLSearchParams({ sort, limit: 50 });
        if (q)              params.append('q', q);
        if (role !== 'all') params.append('role', role);

        // Show shimmer skeleton while loading
        container.innerHTML = Array(6).fill(0).map(() => `
            <div class="card" style="text-align:center;">
                <div class="skeleton" style="width:80px;height:80px;border-radius:50%;margin:15px auto 12px;"></div>
                <div class="skeleton" style="height:18px;width:60%;margin:0 auto 8px;"></div>
                <div class="skeleton" style="height:14px;width:80%;margin:0 auto 8px;"></div>
                <div class="skeleton" style="height:14px;width:50%;margin:0 auto 16px;"></div>
                <div class="skeleton" style="height:38px;border-radius:8px;"></div>
            </div>`).join('');

        try {
            const data  = await apiFetch(`/users?${params.toString()}`);
            const users = data.users || [];

            if (users.length === 0) {
                container.innerHTML = '';
                if (noResults) noResults.style.display = 'block';
                return;
            }
            if (noResults) noResults.style.display = 'none';

            container.innerHTML = users.map((user, i) => {
                const isCompany  = user.role === 'company';
                const badge      = isCompany
                    ? '<span class="badge badge-company" style="position:absolute;top:12px;right:12px;">Company</span>'
                    : '<span class="badge badge-user"    style="position:absolute;top:12px;right:12px;">Individual</span>';
                const avatar     = user.profileImage || `https://i.pravatar.cc/150?u=${user.email}`;
                const lastSeenTxt = !user.isOnline && user.lastSeen
                    ? `<p style="font-size:0.75rem;color:var(--text-secondary);margin:0 0 8px;">Last seen: ${formatLastSeen(user.lastSeen)}</p>`
                    : '';
                const extraInfo = isCompany
                    ? `<p class="text-secondary mb-2" style="font-size:0.8rem;min-height:20px;">${user.industry || ''}${user.companySize ? ' · ' + user.companySize + ' employees' : ''}</p>`
                    : `<p class="text-secondary mb-2" style="font-size:0.8rem;min-height:20px;">${(user.skills || []).slice(0, 3).join(' · ')}</p>`;

                return `
                    <div class="card card-3d card-enter text-center" style="position:relative;animation-delay:${i * 55}ms;">
                        ${badge}
                        <div style="position:relative;width:84px;height:84px;margin:16px auto 12px;">
                            <img src="${avatar}" alt="${user.name}" loading="lazy"
                                 style="width:84px;height:84px;border-radius:50%;object-fit:cover;
                                        border:3px solid var(--border-color);transition:transform 0.3s ease,box-shadow 0.3s ease;"
                                 onmouseover="this.style.transform='scale(1.08)';this.style.boxShadow='0 0 0 4px var(--secondary-color)'"
                                 onmouseout="this.style.transform='';this.style.boxShadow=''">
                            ${user.isOnline
                                ? '<span class="online-dot" style="position:absolute;bottom:3px;right:3px;width:14px;height:14px;border:2px solid var(--surface-color);" title="Online"></span>'
                                : ''}
                        </div>
                        <h3 style="margin-bottom:4px;">${user.name}</h3>
                        <p class="text-secondary mb-1" style="min-height:22px;font-size:0.9rem;">${user.title || (isCompany ? 'Company' : 'Professional')}</p>
                        ${extraInfo}
                        ${lastSeenTxt}
                        <div style="color:#fbbf24;font-size:0.85rem;margin-bottom:14px;">
                            <i class="fas fa-star"></i> ${(user.rating || 0).toFixed(1)}
                            <span style="color:var(--text-secondary);font-size:0.8rem;">(${user.ratingCount || 0})</span>
                        </div>
                        <a href="/profile.html?id=${user._id}" class="btn btn-primary w-full">
                            <i class="fas fa-user"></i> View Profile
                        </a>
                    </div>`;
            }).join('');

        } catch (err) {
            container.innerHTML = '<p class="text-secondary">Failed to load users. Please try again.</p>';
        }
    }

    // Debounced search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchAndRender, 350);
        });
    }
    if (sortFilter) sortFilter.addEventListener('change', fetchAndRender);
    if (typeFilter) typeFilter.addEventListener('change', fetchAndRender);

    // fetchAndRender(); // Disabled to allow EJS SSR on initial load
});
