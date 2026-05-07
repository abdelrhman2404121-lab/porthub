// public/js/profile.js — Full profile page (individual + company)
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let   userId    = urlParams.get('id');
    const currentUser = getCurrentUser();

    if (userId === 'me') {
        if (!currentUser) { window.location.href = '/login.html'; return; }
        userId = currentUser._id;
    }

    if (!userId) {
        document.getElementById('profile-content').innerHTML = '<h2>User not found.</h2>';
        return;
    }

    try {
        const data        = await apiFetch(`/users/${userId}`);
        const profileUser = data.user;
        const avatar      = profileUser.profileImage || `https://i.pravatar.cc/150?u=${profileUser.email}`;

        document.getElementById('prof-avatar').src               = avatar;
        document.getElementById('prof-name').textContent         = profileUser.name;
        document.getElementById('prof-title').textContent        = profileUser.title || '';
        document.getElementById('prof-rating').textContent       = (profileUser.rating || 0).toFixed(1);
        document.getElementById('prof-rating-count').textContent = profileUser.ratingCount || 0;

        // Online / last seen
        const onlineEl = document.getElementById('prof-online-status');
        if (onlineEl) {
            onlineEl.innerHTML = profileUser.isOnline
                ? '<span style="color:#22c55e;"><i class="fas fa-circle" style="font-size:0.6rem;"></i> Online</span>'
                : (profileUser.lastSeen ? `Last seen: ${formatLastSeen(profileUser.lastSeen)}` : '');
        }

        const showEmail = profileUser.settings?.showEmail !== false;
        const showPhone = profileUser.settings?.showPhone !== false;
        document.getElementById('prof-email').textContent = showEmail ? profileUser.email : 'Hidden';
        document.getElementById('prof-phone').textContent = showPhone ? (profileUser.phone || 'Not set') : 'Hidden';
        document.getElementById('prof-bio').textContent   = profileUser.bio || 'No bio provided.';
        const emailBtn = document.getElementById('prof-email-btn');
        if (emailBtn && showEmail) emailBtn.href = `mailto:${profileUser.email}`;

        // Role-based rendering
        if (profileUser.role === 'company') {
            ['ind-skills-card','ind-exp-card','ind-edu-card'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
            ['comp-branches-card','comp-team-card','comp-timeline-card','comp-jobs-card'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='block'; });
            const ph = document.getElementById('proj-header'); if(ph) ph.textContent = 'Products / Services';

            const brEl = document.getElementById('prof-branches');
            if (brEl) brEl.innerHTML = (profileUser.branches||[]).length
                ? profileUser.branches.map(b=>`<div class="p-3" style="background:var(--bg-color);border:1px solid var(--border-color);border-radius:var(--radius-md);"><h4 style="color:var(--primary-color);">${b.name}</h4><p class="text-sm text-secondary m-0"><i class="fas fa-map-marker-alt"></i> ${b.location}</p>${b.contact?`<p class="text-sm text-secondary m-0 mt-1"><i class="fas fa-envelope"></i> ${b.contact}</p>`:''}</div>`).join('')
                : '<p class="text-sm text-secondary">No branches listed.</p>';

            const tmEl = document.getElementById('prof-team');
            if (tmEl) tmEl.innerHTML = (profileUser.team||[]).length
                ? profileUser.team.map(t=>`<div class="flex items-center gap-3 p-2" style="background:var(--bg-color);border-radius:var(--radius-md);"><img src="${t.avatar||'https://i.pravatar.cc/40'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"><div><h4 class="m-0 text-sm">${t.name}</h4><p class="text-xs text-secondary m-0">${t.role}</p></div></div>`).join('')
                : '<p class="text-sm text-secondary">No team members listed.</p>';

            const tlEl = document.getElementById('prof-timeline');
            if (tlEl) { const sorted=[...(profileUser.timeline||[])].sort((a,b)=>new Date(b.date)-new Date(a.date)); tlEl.innerHTML=sorted.length?sorted.map((t,i)=>`<div style="display:flex;gap:20px;margin-bottom:20px;position:relative;">${i!==sorted.length-1?'<div style="position:absolute;left:19px;top:40px;bottom:-20px;width:2px;background:var(--border-color);"></div>':''}<div style="background:rgba(59,130,246,0.1);color:var(--primary-color);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1;"><i class="${t.icon||'fas fa-star'}"></i></div><div class="p-4" style="background:var(--bg-color);border:1px solid var(--border-color);border-radius:var(--radius-md);flex:1;"><span class="text-xs text-primary font-bold">${t.date}</span><h3 class="m-0 mt-1 mb-2">${t.title}</h3><p class="text-sm text-secondary m-0">${t.desc}</p></div></div>`).join(''):'<p class="text-sm text-secondary">No timeline events.</p>'; }

            const jbEl = document.getElementById('prof-jobs');
            if (jbEl) jbEl.innerHTML = (profileUser.jobs||[]).length
                ? profileUser.jobs.map(j=>`<div class="p-4 flex justify-between items-center" style="background:var(--bg-color);border:1px solid var(--border-color);border-radius:var(--radius-md);"><div><h4 class="m-0" style="color:var(--primary-color);">${j.title}</h4><p class="text-sm text-secondary m-0 mt-1"><i class="fas fa-map-marker-alt"></i> ${j.location}</p></div><a href="${j.link}" target="_blank" class="btn btn-primary" style="padding:6px 12px;font-size:0.875rem;">Apply Now</a></div>`).join('')
                : '<p class="text-sm text-secondary">No open positions.</p>';
        } else {
            const skEl = document.getElementById('prof-skills');
            if (skEl) skEl.innerHTML = (profileUser.skills||[]).length
                ? profileUser.skills.map(s=>`<span style="font-size:0.875rem;padding:4px 10px;background:var(--bg-color);border-radius:20px;color:var(--primary-color);border:1px solid var(--border-color);">${s}</span>`).join('')
                : '<p class="text-sm text-secondary">No skills listed.</p>';

            const exEl = document.getElementById('prof-exp');
            if (exEl) exEl.innerHTML = (profileUser.experience||[]).length
                ? profileUser.experience.map(e=>`<div class="mb-3" style="border-left:2px solid var(--border-color);padding-left:15px;"><h4 style="color:var(--primary-color);">${e.role}</h4><p class="text-secondary text-sm">${e.company} | ${e.years||''}</p></div>`).join('')
                : '<p class="text-sm text-secondary">No experience listed.</p>';

            const edEl = document.getElementById('prof-edu');
            if (edEl) edEl.innerHTML = (profileUser.education||[]).length
                ? profileUser.education.map(e=>`<div class="mb-3" style="border-left:2px solid var(--border-color);padding-left:15px;"><h4 style="color:var(--primary-color);">${e.degree}</h4><p class="text-secondary text-sm">${e.school} | ${e.year||''}</p></div>`).join('')
                : '<p class="text-sm text-secondary">No education listed.</p>';
        }

        // Projects
        const projEl = document.getElementById('prof-proj');
        if (projEl) {
            try {
                const pd = await apiFetch(`/projects/user/${userId}`);
                const projects = pd.projects || [];
                projEl.innerHTML = projects.length
                    ? projects.map(p=>`<div style="padding:15px;background:var(--bg-color);border-radius:var(--radius-md);border:1px solid var(--border-color);"><h4>${p.title}</h4><p class="text-secondary text-sm mb-2">${p.description||p.desc||''}</p>${p.githubLink?`<a href="${p.githubLink}" target="_blank" class="text-sm mr-2"><i class="fab fa-github"></i> GitHub</a>`:''}${p.liveDemo?`<a href="${p.liveDemo}" target="_blank" class="text-sm"><i class="fas fa-external-link-alt"></i> Live</a>`:''}</div>`).join('')
                    : '<p class="text-sm text-secondary">No projects listed.</p>';
            } catch { projEl.innerHTML = '<p class="text-sm text-secondary">Could not load projects.</p>'; }
        }

        // Comments
        async function renderComments() {
            const commEl = document.getElementById('prof-comments');
            if (!commEl) return;
            try {
                const cd = await apiFetch(`/comments/${userId}`);
                commEl.innerHTML = (cd.comments||[]).length
                    ? cd.comments.map(c => {
                        const au = c.userId || {};
                        return `<div class="mb-3 p-3" style="background:var(--bg-color);border-radius:var(--radius-md);"><div class="flex justify-between items-center mb-1"><div class="flex items-center gap-2"><img src="${au.profileImage||`https://i.pravatar.cc/30?u=${au._id}`}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;"><strong>${au.name||'Anonymous'}</strong></div><span class="text-sm text-secondary">${formatLastSeen(c.createdAt)}</span></div>${c.rating?`<div style="color:#fbbf24;">${'★'.repeat(c.rating)}</div>`:''}<p class="text-sm mt-1">${c.comment}</p>${currentUser&&(currentUser._id===String(au._id)||currentUser.role==='admin')?`<button class="btn btn-outline" style="padding:2px 8px;font-size:0.75rem;color:var(--danger);border-color:var(--danger);" onclick="window.delComment('${c._id}')">Delete</button>`:''}</div>`;
                    }).join('')
                    : '<p class="text-sm text-secondary">No comments yet.</p>';
            } catch {}
        }
        renderComments();

        window.delComment = async id => {
            if (!confirm('Delete comment?')) return;
            try { await apiFetch(`/comments/${id}`, { method: 'DELETE' }); showNotification('Deleted.'); renderComments(); }
            catch (err) { showNotification(err.message, 'error'); }
        };

        // Viewers button — show modal with viewer list (only meaningful for own profile)
        const viewersBtn   = document.getElementById('profile-viewers-btn');
        const viewersBadge = document.getElementById('profile-viewers-badge');
        const viewersModal = document.getElementById('profile-viewers-modal');
        const viewersList  = document.getElementById('profile-modal-viewers-list');
        const closeViewersModal = document.getElementById('close-profile-viewers-modal');

        if (viewersBtn && profileUser.viewers && profileUser.viewers.length > 0) {
            viewersBadge && (viewersBadge.style.display = 'block');
            viewersBtn.setAttribute('title', `${profileUser.viewers.length} viewer${profileUser.viewers.length !== 1 ? 's' : ''}`);
        }

        if (viewersBtn) {
            viewersBtn.addEventListener('click', () => {
                if (!profileUser.viewers || profileUser.viewers.length === 0) {
                    return;
                }
                viewersList.innerHTML = profileUser.viewers.map(v => `
                    <div class="flex items-center justify-between p-2" style="background: rgba(255,255,255,0.1); border-radius: var(--radius-md);">
                        <div class="flex items-center gap-3">
                            <img src="${v.avatar || `https://i.pravatar.cc/40?u=${v.userId}`}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
                            <div>
                                <p class="m-0 text-sm font-bold" style="color:white;">${v.name || 'Unknown'}</p>
                                <p class="m-0 text-xs" style="color:rgba(255,255,255,0.7);">${formatLastSeen(v.viewedAt)}</p>
                            </div>
                        </div>
                        <a href="/profile.html?id=${v.userId}" class="btn btn-sm" style="background:white;color:var(--primary-color);padding:4px 10px;font-size:0.8rem;">View</a>
                    </div>`).join('');
                viewersModal.style.display = 'flex';
            });
        }

        if (closeViewersModal) {
            closeViewersModal.addEventListener('click', () => viewersModal.style.display = 'none');
        }

        // Interactions for other logged-in users

        if (currentUser && currentUser._id !== userId) {
            const loginNotice = document.getElementById('login-to-comment');
            const commentForm = document.getElementById('comment-form');
            const rateBtn     = document.getElementById('rate-btn');
            if (loginNotice) loginNotice.style.display = 'none';
            if (commentForm) commentForm.style.display = 'block';
            if (rateBtn)     rateBtn.style.display     = 'inline-flex';

            if (commentForm) {
                commentForm.addEventListener('submit', async e => {
                    e.preventDefault();
                    const text = document.getElementById('comment-text').value.trim();
                    if (!text) return;
                    try {
                        await apiFetch(`/comments/${userId}`, { method:'POST', body: JSON.stringify({ comment: text }) });
                        document.getElementById('comment-text').value = '';
                        showNotification('Comment added!');
                        renderComments();
                    } catch (err) { showNotification(err.message, 'error'); }
                });
            }

            const modal = document.getElementById('rating-modal');
            if (rateBtn && modal) {
                rateBtn.addEventListener('click', () => modal.style.display='flex');
                document.getElementById('cancel-rate').addEventListener('click', () => modal.style.display='none');
                document.getElementById('submit-rate').addEventListener('click', async () => {
                    const val = parseInt(document.getElementById('rating-val').value);
                    try {
                        const res = await apiFetch(`/users/${userId}/rate`, { method:'POST', body: JSON.stringify({ rating: val }) });
                        document.getElementById('prof-rating').textContent      = res.rating.toFixed(1);
                        document.getElementById('prof-rating-count').textContent = res.ratingCount;
                        modal.style.display = 'none';
                        showNotification('Rating submitted!');
                    } catch (err) { showNotification(err.message||'Already rated.', 'error'); }
                });
            }

            const connectBtn = document.getElementById('connect-btn');
            if (connectBtn) {
                let type='', text='', canConnect=false;
                if (currentUser.role==='individual' && profileUser.role==='company') { canConnect=true; type='join';   text='<i class="fas fa-handshake"></i> Request to Join'; }
                if (currentUser.role==='company'    && profileUser.role==='individual') { canConnect=true; type='invite'; text='<i class="fas fa-user-plus"></i> Invite to Team'; }
                if (canConnect) {
                    connectBtn.style.display = 'inline-flex';
                    const hasPending = (profileUser.requests||[]).some(r => r.fromId && String(r.fromId)===currentUser._id && r.status==='pending');
                    if (hasPending) { connectBtn.innerHTML='<i class="fas fa-clock"></i> Request Pending'; connectBtn.disabled=true; }
                    else {
                        connectBtn.innerHTML = text;
                        connectBtn.addEventListener('click', async () => {
                            try {
                                await apiFetch(`/users/${userId}/request`, { method:'POST', body: JSON.stringify({ type }) });
                                showNotification(type==='join' ? 'Request sent!' : 'Invitation sent!');
                                connectBtn.innerHTML = '<i class="fas fa-clock"></i> Request Pending';
                                connectBtn.disabled  = true;
                            } catch (err) { showNotification(err.message, 'error'); }
                        });
                    }
                }
            }

            // ── Contact / Message button ──────────────────────────────────────
            const emailBtn = document.getElementById('prof-email-btn');
            if (emailBtn) {
                emailBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Message';
                emailBtn.href = '#';
                emailBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    let modal = document.getElementById('msg-request-modal');
                    if (modal) { modal.style.display = 'flex'; return; }
                    modal = document.createElement('div');
                    modal.id = 'msg-request-modal';
                    modal.style.cssText = 'display:flex;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
                    const avatar = profileUser.profileImage || `https://i.pravatar.cc/50?u=${profileUser.email}`;
                    modal.innerHTML = `
                        <div class="card animate-fade-in" style="width:100%;max-width:460px;padding:32px;border-radius:var(--radius-lg);position:relative;">
                            <button id="close-msg-modal" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-secondary);"><i class="fas fa-times"></i></button>
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
                                <img src="${avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--border-color);">
                                <div>
                                    <h3 style="margin:0;">${profileUser.name}</h3>
                                    <p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">${profileUser.title || profileUser.role}</p>
                                </div>
                            </div>
                            <div class="form-group">
                                <label style="font-weight:600;">Your message</label>
                                <textarea id="msg-request-text" class="form-control" rows="4"
                                    placeholder="Hi ${profileUser.name}, I'd like to connect..."
                                    style="resize:none;margin-top:8px;"></textarea>
                            </div>
                            <button id="send-msg-request" class="btn btn-primary w-full"><i class="fas fa-paper-plane"></i> Send Message</button>
                        </div>`;
                    document.body.appendChild(modal);
                    document.getElementById('close-msg-modal').addEventListener('click', () => modal.remove());
                    modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
                    document.getElementById('send-msg-request').addEventListener('click', async () => {
                        const txt = document.getElementById('msg-request-text').value.trim();
                        if (!txt) { showNotification('Please write a message first.', 'error'); return; }
                        const btn = document.getElementById('send-msg-request');
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                        try {
                            await apiFetch('/messages/request', { method:'POST', body: JSON.stringify({ receiverId: userId, message: txt }) });
                            showNotification('Message sent! Redirecting...');
                            modal.remove();
                            setTimeout(() => window.location.href = '/messages.html', 1200);
                        } catch (err) {
                            showNotification(err.message || 'Failed to send.', 'error');
                            btn.disabled = false;
                            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                        }
                    });
                });
            }
        }

    } catch (err) {
        console.error('Profile error:', err);
        const c = document.getElementById('profile-content');
        if (c) c.innerHTML = '<h2>Could not load profile.</h2>';
    }
});
