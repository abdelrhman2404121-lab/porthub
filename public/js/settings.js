// public/js/settings.js — Settings page (profile, privacy, password, skills, projects, company sections)
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

    let currentUser;
    try {
        const data = await apiFetch('/auth/me');
        currentUser = data.user;
        setSession(getToken(), currentUser);
    } catch { window.location.href = '/login.html'; return; }

    // ── Navigation ────────────────────────────────────────────────────────────
    const navButtons = document.querySelectorAll('.settings-nav button');
    const sections   = document.querySelectorAll('.settings-section');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });

    // Role-based nav
    if (currentUser.role === 'company') {
        const navCo = document.getElementById('nav-company-details');
        const navTm = document.getElementById('nav-company-team');
        const navPs = document.getElementById('nav-projects-skills');
        const cvTtl = document.getElementById('cv-upload-title');
        if (navCo) navCo.style.display = 'block';
        if (navTm) navTm.style.display = 'block';
        if (navPs) navPs.textContent   = 'Products & Services';
        if (cvTtl) cvTtl.textContent   = 'Upload Company Brochure / Pitch Deck';
    }

    // ── Account Form ──────────────────────────────────────────────────────────
    const setEl = id => document.getElementById(id);
    setEl('set-name')  && (setEl('set-name').value   = currentUser.name   || '');
    setEl('set-title') && (setEl('set-title').value  = currentUser.title  || '');
    setEl('set-email') && (setEl('set-email').value  = currentUser.email  || '');
    setEl('set-phone') && (setEl('set-phone').value  = currentUser.phone  || '');
    setEl('set-bio')   && (setEl('set-bio').value    = currentUser.bio    || '');
    setEl('set-avatar')&& (setEl('set-avatar').value = currentUser.profileImage || '');

    // Avatar Preview
    if (currentUser.profileImage && document.getElementById('avatar-preview')) {
        const preview = document.getElementById('avatar-preview');
        const icon    = document.getElementById('avatar-icon');
        preview.src   = currentUser.profileImage;
        preview.style.display = 'block';
        if (icon) icon.style.display = 'none';
    }

    // Avatar Upload Logic
    const avatarDropArea = document.getElementById('avatar-drop-area');
    const avatarFileInput = document.getElementById('avatar-file-input');
    const avatarError = document.getElementById('avatar-error');

    if (avatarDropArea && avatarFileInput) {
        avatarDropArea.addEventListener('click', () => avatarFileInput.click());
        
        avatarDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            avatarDropArea.style.borderColor = 'var(--primary-color)';
        });

        avatarDropArea.addEventListener('dragleave', () => {
            avatarDropArea.style.borderColor = 'var(--border-color)';
        });

        avatarDropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            avatarDropArea.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files.length) {
                await uploadAvatar(e.dataTransfer.files[0]);
            }
        });

        avatarFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length) {
                await uploadAvatar(e.target.files[0]);
            }
        });
    }

    async function uploadAvatar(file) {
        if (!file.type.startsWith('image/')) {
            if (avatarError) { avatarError.textContent = 'Please upload an image file.'; avatarError.style.display = 'block'; }
            return;
        }
        if (avatarError) avatarError.style.display = 'none';
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            
            // Set URL
            const url = data.url;
            setEl('set-avatar').value = url;
            
            // Show preview
            const preview = document.getElementById('avatar-preview');
            const icon    = document.getElementById('avatar-icon');
            if (preview) { preview.src = url; preview.style.display = 'block'; }
            if (icon) icon.style.display = 'none';
            
            showNotification('Image uploaded successfully! Click Save Changes to apply.');
        } catch (err) {
            if (avatarError) { avatarError.textContent = err.message; avatarError.style.display = 'block'; }
        }
    }

    // CV Upload Logic
    let currentCvUrl = currentUser.cvUrl || '';
    const cvDropArea = document.getElementById('cv-drop-area');
    const cvFileInput = document.getElementById('cv-file-input');
    const cvError = document.getElementById('cv-error');
    const cvFileInfo = document.getElementById('cv-file-info');
    const cvFileName = document.getElementById('cv-file-name');

    if (cvDropArea && cvFileInput) {
        cvDropArea.addEventListener('click', () => cvFileInput.click());
        
        cvDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            cvDropArea.style.borderColor = 'var(--primary-color)';
        });

        cvDropArea.addEventListener('dragleave', () => {
            cvDropArea.style.borderColor = 'var(--border-color)';
        });

        cvDropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            cvDropArea.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files.length) {
                await uploadCV(e.dataTransfer.files[0]);
            }
        });

        cvFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length) {
                await uploadCV(e.target.files[0]);
            }
        });
        
        if (currentCvUrl && cvFileInfo && cvFileName) {
            cvFileName.textContent = currentCvUrl.split('/').pop() || 'Current CV.pdf';
            cvFileInfo.style.display = 'block';
        }
    }

    async function uploadCV(file) {
        if (file.type !== 'application/pdf') {
            if (cvError) { cvError.textContent = 'Please upload a PDF file.'; cvError.style.display = 'block'; }
            return;
        }
        if (cvError) cvError.style.display = 'none';
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            
            // Set URL
            currentCvUrl = data.url;
            
            // Show file info
            if (cvFileInfo && cvFileName) {
                cvFileName.textContent = file.name;
                cvFileInfo.style.display = 'block';
            }
            showNotification('CV uploaded successfully! Click Save Changes to apply.');
        } catch (err) {
            if (cvError) { cvError.textContent = err.message; cvError.style.display = 'block'; }
        }
    }

    const accountForm = document.getElementById('form-account');
    if (accountForm) {
        accountForm.addEventListener('submit', async e => {
            e.preventDefault();
            const newName = setEl('set-name').value.trim();
            if (!newName || /\d/.test(newName)) { showNotification('Name cannot contain numbers.', 'error'); return; }
            try {
                const res = await apiFetch('/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify({
                        name:         newName,
                        title:        setEl('set-title').value.trim(),
                        email:        setEl('set-email').value.trim(),
                        phone:        setEl('set-phone').value.trim(),
                        bio:          setEl('set-bio').value.trim(),
                        profileImage: setEl('set-avatar').value.trim() || `https://i.pravatar.cc/150?u=${currentUser.email}`,
                        cvUrl:        currentCvUrl
                    })
                });
                currentUser = res.user;
                setSession(getToken(), currentUser);
                showNotification('Profile updated successfully!');
                const greet = document.getElementById('user-greeting');
                const avEl  = document.getElementById('nav-avatar');
                if (greet) greet.textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
                if (avEl)  avEl.src          = currentUser.profileImage;
            } catch (err) { showNotification(err.message || 'Update failed.', 'error'); }
        });
    }

    // ── Privacy Form ──────────────────────────────────────────────────────────
    const privEmail = document.getElementById('priv-email');
    const privPhone = document.getElementById('priv-phone');
    if (privEmail) privEmail.checked = currentUser.settings?.showEmail ?? true;
    if (privPhone) privPhone.checked = currentUser.settings?.showPhone ?? true;

    const privacyForm = document.getElementById('form-privacy');
    if (privacyForm) {
        privacyForm.addEventListener('submit', async e => {
            e.preventDefault();
            try {
                await apiFetch('/users/settings', {
                    method: 'PUT',
                    body: JSON.stringify({ settings: {
                        showEmail: privEmail ? privEmail.checked : true,
                        showPhone: privPhone ? privPhone.checked : true
                    }})
                });
                showNotification('Privacy settings updated!');
            } catch (err) { showNotification(err.message, 'error'); }
        });
    }

    // ── Security Form ─────────────────────────────────────────────────────────
    const secForm = document.getElementById('form-security');
    if (secForm) {
        secForm.addEventListener('submit', async e => {
            e.preventDefault();
            const cur  = document.getElementById('sec-current').value;
            const nw   = document.getElementById('sec-new').value;
            const conf = document.getElementById('sec-confirm').value;
            const errDiv = document.getElementById('sec-error');
            if (errDiv) errDiv.style.display = 'none';

            const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
            if (!passRegex.test(nw)) {
                if (errDiv) { errDiv.textContent='Password must be 8+ chars with a letter and number.'; errDiv.style.display='block'; }
                return;
            }
            if (nw !== conf) {
                if (errDiv) { errDiv.textContent='Passwords do not match.'; errDiv.style.display='block'; }
                return;
            }
            try {
                await apiFetch('/users/settings', { method:'PUT', body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
                showNotification('Password changed successfully!');
                secForm.reset();
            } catch (err) {
                if (errDiv) { errDiv.textContent = err.message || 'Failed.'; errDiv.style.display='block'; }
            }
        });
    }

    // ── Skills (individual only) ───────────────────────────────────────────────
    function renderSkills() {
        const el = document.getElementById('set-skills-list');
        if (!el) return;
        el.innerHTML = (currentUser.skills||[]).length
            ? currentUser.skills.map((s, i) => `
                <div style="font-size:0.875rem;padding:4px 10px;background:var(--bg-color);border-radius:20px;border:1px solid var(--border-color);display:flex;align-items:center;gap:5px;">
                    ${s} <i class="fas fa-times text-danger" style="cursor:pointer;" onclick="window.removeSkill(${i})"></i>
                </div>`).join('')
            : '<p class="text-sm text-secondary">No skills added yet.</p>';
    }
    renderSkills();

    const skillForm = document.getElementById('form-skills');
    if (skillForm) {
        skillForm.addEventListener('submit', async e => {
            e.preventDefault();
            const inp   = document.getElementById('set-new-skill');
            const skill = inp.value.trim();
            if (!skill) return;
            try {
                const res = await apiFetch('/users/skills', { method:'POST', body: JSON.stringify({ skill }) });
                currentUser.skills = res.skills;
                setSession(getToken(), currentUser);
                renderSkills();
                inp.value = '';
            } catch (err) { showNotification(err.message, 'error'); }
        });
    }

    window.removeSkill = async idx => {
        const skill = currentUser.skills[idx];
        if (!skill) return;
        try {
            const res = await apiFetch(`/users/skills/${encodeURIComponent(skill)}`, { method:'DELETE' });
            currentUser.skills = res.skills;
            setSession(getToken(), currentUser);
            renderSkills();
        } catch (err) { showNotification(err.message, 'error'); }
    };

    // ── Projects ──────────────────────────────────────────────────────────────
    let myProjects = [];
    async function loadProjects() {
        try {
            const res = await apiFetch('/projects/mine');
            myProjects = res.projects || [];
            renderProjects();
        } catch {}
    }

    function renderProjects() {
        const el = document.getElementById('set-projects-list');
        if (!el) return;
        el.innerHTML = myProjects.length
            ? myProjects.map(p => `
                <div class="mb-3 p-3" style="background:var(--bg-color);border-radius:var(--radius-md);display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <h4 style="margin-bottom:5px;">${p.title}</h4>
                        <p class="text-sm text-secondary" style="margin-bottom:5px;">${p.description||p.desc||''}</p>
                        ${p.githubLink?`<a href="${p.githubLink}" target="_blank" class="text-sm mr-2">GitHub</a>`:''}
                        ${p.liveDemo  ?`<a href="${p.liveDemo}"   target="_blank" class="text-sm">Live</a>`:''}
                    </div>
                    <button class="btn btn-outline" style="color:var(--danger);border-color:var(--danger);padding:5px 10px;" onclick="window.removeProject('${p._id}')">Delete</button>
                </div>`).join('')
            : '<p class="text-sm text-secondary">No projects added yet.</p>';
    }

    // Projects Upload Logic
    let currentProjectImage = '';
    const projDropArea = document.getElementById('projects-drop-area');
    const projFileInput = document.getElementById('projects-file-input');
    const projError = document.getElementById('projects-error');
    const projFilesInfo = document.getElementById('projects-files-info');

    if (projDropArea && projFileInput) {
        projDropArea.addEventListener('click', () => projFileInput.click());
        
        projDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            projDropArea.style.borderColor = 'var(--primary-color)';
        });

        projDropArea.addEventListener('dragleave', () => {
            projDropArea.style.borderColor = 'var(--border-color)';
        });

        projDropArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            projDropArea.style.borderColor = 'var(--border-color)';
            if (e.dataTransfer.files.length) {
                await uploadProjectImage(e.dataTransfer.files[0]);
            }
        });

        projFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length) {
                await uploadProjectImage(e.target.files[0]);
            }
        });
    }

    async function uploadProjectImage(file) {
        // Removed the image/ check to allow generic files as requested
        if (projError) projError.style.display = 'none';
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getToken()}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            
            // Set URL
            currentProjectImage = data.url;
            
            // Show file info
            if (projFilesInfo) {
                const isImage = file.type.startsWith('image/');
                const icon = isImage ? 'fa-image' : 'fa-file-alt';
                projFilesInfo.innerHTML = `<p><i class="fas ${icon}"></i> ${file.name} (Uploaded)</p>`;
                projFilesInfo.style.display = 'block';
            }
            showNotification('Project file uploaded! Now fill in the details and Add Project.');
        } catch (err) {
            if (projError) { projError.textContent = err.message; projError.style.display = 'block'; }
        }
    }

    const projForm = document.getElementById('form-add-project');
    if (projForm) {
        projForm.addEventListener('submit', async e => {
            e.preventDefault();
            const title = document.getElementById('set-proj-title').value.trim();
            const desc  = document.getElementById('set-proj-desc').value.trim();
            const link  = document.getElementById('set-proj-link').value.trim();
            if (!title || !desc) return;
            try {
                await apiFetch('/projects', { method:'POST', body: JSON.stringify({ 
                    title, description: desc, desc, link, liveDemo: link, image: currentProjectImage 
                }) });
                showNotification('Project added!');
                projForm.reset();
                currentProjectImage = '';
                if (projFilesInfo) projFilesInfo.style.display = 'none';
                loadProjects();
            } catch (err) { showNotification(err.message, 'error'); }
        });
    }

    window.removeProject = async id => {
        if (!confirm('Delete this project?')) return;
        try {
            await apiFetch(`/projects/${id}`, { method:'DELETE' });
            showNotification('Project removed.');
            loadProjects();
        } catch (err) { showNotification(err.message, 'error'); }
    };

    loadProjects();

    // ── Company-specific sections ─────────────────────────────────────────────
    if (currentUser.role === 'company') {

        // Branches
        function renderBranches() {
            const el = document.getElementById('set-branches-list');
            if (!el) return;
            el.innerHTML = (currentUser.branches||[]).length
                ? currentUser.branches.map(b=>`<div class="p-4 mb-3 flex justify-between items-center glass-panel hover-lift animate-fade-in" style="border-radius:var(--radius-lg);"><div><h4 class="m-0" style="color:var(--primary-color);">${b.name}</h4><p class="text-sm text-secondary m-0 mt-1"><i class="fas fa-map-marker-alt"></i> ${b.location} | <i class="fas fa-envelope"></i> ${b.contact}</p></div><button class="btn btn-outline text-danger" style="padding:6px 12px;border-color:var(--danger);" onclick="window.removeBranch('${b._id}')"><i class="fas fa-trash"></i></button></div>`).join('')
                : '<p class="text-sm text-secondary">No branches yet.</p>';
        }
        renderBranches();

        const branchForm = document.getElementById('form-add-branch');
        if (branchForm) {
            branchForm.addEventListener('submit', async e => {
                e.preventDefault();
                const name    = document.getElementById('set-branch-name').value.trim();
                const loc     = document.getElementById('set-branch-loc').value.trim();
                const contact = document.getElementById('set-branch-contact').value.trim();
                if (!name || !loc) return;
                try {
                    const res = await apiFetch('/users/profile', { method:'PUT', body: JSON.stringify({ branches: [...(currentUser.branches||[]), { name, location: loc, contact }] }) });
                    currentUser = res.user; setSession(getToken(), currentUser);
                    renderBranches(); branchForm.reset(); showNotification('Branch added!');
                } catch (err) { showNotification(err.message,'error'); }
            });
        }

        window.removeBranch = async id => {
            try {
                const res = await apiFetch('/users/profile', { method:'PUT', body: JSON.stringify({ branches: (currentUser.branches||[]).filter(b=>String(b._id)!==id) }) });
                currentUser = res.user; setSession(getToken(), currentUser); renderBranches(); showNotification('Branch removed.');
            } catch (err) { showNotification(err.message,'error'); }
        };

        // Team Members
        function renderTeam() {
            const el = document.getElementById('set-team-list');
            if (!el) return;
            el.innerHTML = (currentUser.team||[]).length
                ? currentUser.team.map(t=>`<div class="p-4 mb-3 flex justify-between items-center glass-panel hover-lift animate-fade-in" style="border-radius:var(--radius-lg);"><div class="flex items-center gap-3"><div class="avatar-ring"><img src="${t.avatar || 'https://i.pravatar.cc/150'}" style="width:40px;height:40px;object-fit:cover;"></div><div><h4 class="m-0" style="color:var(--primary-color);">${t.name}</h4><p class="text-sm text-secondary m-0">${t.role}</p></div></div><button class="btn btn-outline text-danger" style="padding:6px 12px;border-color:var(--danger);" onclick="window.removeTeam('${t._id}')"><i class="fas fa-trash"></i></button></div>`).join('')
                : '<p class="text-sm text-secondary">No team members yet.</p>';
        }
        renderTeam();

        const teamForm = document.getElementById('form-add-team');
        if (teamForm) {
            teamForm.addEventListener('submit', async e => {
                e.preventDefault();
                const name   = document.getElementById('set-team-name').value.trim();
                const role   = document.getElementById('set-team-role').value.trim();
                const avatar = document.getElementById('set-team-avatar').value.trim();
                if (!name || !role) return;
                try {
                    const res = await apiFetch('/users/profile', { method:'PUT', body: JSON.stringify({ team: [...(currentUser.team||[]), { name, role, avatar }] }) });
                    currentUser = res.user; setSession(getToken(), currentUser);
                    renderTeam(); teamForm.reset(); showNotification('Team member added!');
                } catch (err) { showNotification(err.message,'error'); }
            });
        }

        window.removeTeam = async id => {
            if (!confirm('Remove this team member?')) return;
            try {
                const res = await apiFetch('/users/profile', { method:'PUT', body: JSON.stringify({ team: (currentUser.team||[]).filter(t=>String(t._id)!==id) }) });
                currentUser = res.user; setSession(getToken(), currentUser); renderTeam(); showNotification('Team member removed.');
            } catch (err) { showNotification(err.message,'error'); }
        };

        // Jobs
        function renderJobs() {
            const el = document.getElementById('set-jobs-list');
            if (!el) return;
            el.innerHTML = (currentUser.jobs||[]).length
                ? currentUser.jobs.map(j=>`<div class="p-4 mb-3 flex justify-between items-center glass-panel hover-lift animate-fade-in" style="border-radius:var(--radius-lg);"><div><h4 class="m-0" style="color:var(--primary-color);">${j.title}</h4><p class="text-sm text-secondary m-0 mt-1"><i class="fas fa-briefcase"></i> ${j.location} | <a href="${j.link}" target="_blank" style="font-weight:600;">Apply</a></p></div><button class="btn btn-outline text-danger" style="padding:6px 12px;border-color:var(--danger);" onclick="window.removeJob('${j._id}')"><i class="fas fa-trash"></i></button></div>`).join('')
                : '<p class="text-sm text-secondary">No job openings posted.</p>';
        }
        renderJobs();

        const jobForm = document.getElementById('form-add-job');
        if (jobForm) {
            jobForm.addEventListener('submit', async e => {
                e.preventDefault();
                const title    = document.getElementById('set-job-title').value.trim();
                const location = document.getElementById('set-job-loc').value.trim();
                const link     = document.getElementById('set-job-link').value.trim();
                if (!title || !location || !link) return;
                try {
                    const res = await apiFetch('/users/profile', { method:'PUT', body: JSON.stringify({ jobs: [...(currentUser.jobs||[]), { title, location, link }] }) });
                    currentUser = res.user; setSession(getToken(), currentUser);
                    renderJobs(); jobForm.reset(); showNotification('Job posted!');
                } catch (err) { showNotification(err.message,'error'); }
            });
        }

        window.removeJob = async id => {
            try {
                const res = await apiFetch('/users/profile', { method:'PUT', body: JSON.stringify({ jobs: (currentUser.jobs||[]).filter(j=>String(j._id)!==id) }) });
                currentUser = res.user; setSession(getToken(), currentUser); renderJobs(); showNotification('Job removed.');
            } catch (err) { showNotification(err.message,'error'); }
        };
    }

    // ── Experience (individual) ────────────────────────────────────────────────
    if (currentUser.role === 'individual') {
        function renderExp() {
            const el = document.getElementById('set-exp-list');
            if (!el) return;
            el.innerHTML = (currentUser.experience||[]).length
                ? currentUser.experience.map(e=>`<div class="mb-3 p-4 glass-panel hover-lift animate-fade-in" style="border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center;"><div><h4 class="m-0" style="color:var(--primary-color);">${e.role}</h4><p class="text-sm text-secondary m-0 mt-1">${e.company} | ${e.years||''}</p></div><button class="btn btn-outline" style="color:var(--danger);border-color:var(--danger);padding:6px 12px;" onclick="window.removeExp('${e._id}')"><i class="fas fa-trash"></i></button></div>`).join('')
                : '<p class="text-sm text-secondary">No experience added yet.</p>';
        }
        renderExp();

        const expForm = document.getElementById('form-add-exp');
        if (expForm) {
            expForm.addEventListener('submit', async e => {
                e.preventDefault();
                const role    = document.getElementById('set-exp-role').value.trim();
                const company = document.getElementById('set-exp-company').value.trim();
                const years   = document.getElementById('set-exp-years').value.trim();
                if (!role || !company) return;
                try {
                    const res = await apiFetch('/users/experience', { method:'POST', body: JSON.stringify({ role, company, years }) });
                    currentUser.experience = res.experience; setSession(getToken(), currentUser);
                    renderExp(); expForm.reset(); showNotification('Experience added!');
                } catch (err) { showNotification(err.message,'error'); }
            });
        }

        window.removeExp = async id => {
            try {
                const res = await apiFetch(`/users/experience/${id}`, { method:'DELETE' });
                currentUser.experience = res.experience; setSession(getToken(), currentUser); renderExp();
            } catch (err) { showNotification(err.message,'error'); }
        };

        // Education
        function renderEdu() {
            const el = document.getElementById('set-edu-list');
            if (!el) return;
            el.innerHTML = (currentUser.education||[]).length
                ? currentUser.education.map(e=>`<div class="mb-3 p-4 glass-panel hover-lift animate-fade-in" style="border-radius:var(--radius-lg);display:flex;justify-content:space-between;align-items:center;"><div><h4 class="m-0" style="color:var(--primary-color);">${e.degree}</h4><p class="text-sm text-secondary m-0 mt-1">${e.school} | ${e.year||''}</p></div><button class="btn btn-outline" style="color:var(--danger);border-color:var(--danger);padding:6px 12px;" onclick="window.removeEdu('${e._id}')"><i class="fas fa-trash"></i></button></div>`).join('')
                : '<p class="text-sm text-secondary">No education added yet.</p>';
        }
        renderEdu();

        const eduForm = document.getElementById('form-add-edu');
        if (eduForm) {
            eduForm.addEventListener('submit', async e => {
                e.preventDefault();
                const degree = document.getElementById('set-edu-degree').value.trim();
                const school = document.getElementById('set-edu-school').value.trim();
                const year   = document.getElementById('set-edu-year').value.trim();
                if (!degree || !school) return;
                try {
                    const res = await apiFetch('/users/education', { method:'POST', body: JSON.stringify({ degree, school, year }) });
                    currentUser.education = res.education; setSession(getToken(), currentUser);
                    renderEdu(); eduForm.reset(); showNotification('Education added!');
                } catch (err) { showNotification(err.message,'error'); }
            });
        }

        window.removeEdu = async id => {
            try {
                const res = await apiFetch(`/users/education/${id}`, { method:'DELETE' });
                currentUser.education = res.education; setSession(getToken(), currentUser); renderEdu();
            } catch (err) { showNotification(err.message,'error'); }
        };
    }
});
