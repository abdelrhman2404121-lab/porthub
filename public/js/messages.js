// public/js/messages.js — Request-based chat messaging
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) { window.location.href = '/login.html'; return; }

    const currentUser     = getCurrentUser();
    const chatList        = document.getElementById('chat-list');
    const requestsSection = document.getElementById('requests-section');
    const requestsList    = document.getElementById('requests-list');
    const chatMessages    = document.getElementById('chat-messages');
    const messageInput    = document.getElementById('message-input');
    const sendBtn         = document.getElementById('send-btn');
    const chatAvatar      = document.getElementById('chat-avatar');
    const chatName        = document.getElementById('chat-name');

    let activeConvoId     = null;
    let conversations     = [];
    let pollInterval      = null;

    // Open conversation from URL ?user=userId
    const urlParams    = new URLSearchParams(window.location.search);
    const initialUserId= urlParams.get('user');

    // ── Load all conversations ────────────────────────────────────────────────
    async function loadConversations() {
        try {
            const data = await apiFetch('/messages/conversations');
            conversations = data.conversations || [];
            
            const q = urlParams.get('q');
            if (q) {
                const searchForm = document.getElementById('global-search-form');
                if (searchForm) {
                    const input = searchForm.querySelector('input');
                    if (input) input.value = q;
                }
                const lowerQ = q.toLowerCase();
                conversations = conversations.filter(c => {
                    const other = c.participants.find(p => (p._id || p) !== currentUser._id);
                    return other && other.name && other.name.toLowerCase().includes(lowerQ);
                });
            }

            renderRequests();
            renderChatList();

            // If URL has ?user=, open or initiate that chat
            if (initialUserId && !activeConvoId) {
                const existing = conversations.find(c =>
                    c.status === 'accepted' &&
                    c.participants.some(p => p._id === initialUserId || p === initialUserId)
                );
                if (existing) openChat(existing._id);
                else openNewChat(initialUserId);
            }
        } catch (err) { console.error('loadConversations:', err); }
    }

    const createGroupBtn = document.getElementById('create-group-btn');
    const groupModal = document.getElementById('group-chat-modal');
    const closeGroupModal = document.getElementById('close-group-modal');
    const cancelGroupBtn = document.getElementById('cancel-group-btn');
    const confirmGroupBtn = document.getElementById('confirm-group-btn');
    const groupMembersList = document.getElementById('group-members-list');
    const groupChatName = document.getElementById('group-chat-name');

    if (createGroupBtn && currentUser.role === 'company') {
        createGroupBtn.style.display = 'block';

        const hideGroupModal = () => {
            if (groupModal) groupModal.style.display = 'none';
            if (groupChatName) groupChatName.value = '';
        };

        if (closeGroupModal) closeGroupModal.addEventListener('click', hideGroupModal);
        if (cancelGroupBtn) cancelGroupBtn.addEventListener('click', hideGroupModal);

        createGroupBtn.addEventListener('click', () => {
            if (!groupModal) return;
            groupModal.style.display = 'flex';
            
            // Render accepted team members
            if (currentUser.team && currentUser.team.length > 0) {
                const accepted = currentUser.team; // all users in the team array are accepted
                if (accepted.length === 0) {
                    groupMembersList.innerHTML = '<p class="text-secondary text-sm">No active team members.</p>';
                } else {
                    groupMembersList.innerHTML = accepted.map(t => `
                        <label class="flex items-center gap-3 p-2" style="background:var(--bg-color); border-radius:var(--radius-sm); cursor:pointer;">
                            <input type="checkbox" class="group-member-checkbox" value="${t.userId}" checked>
                            <img src="${t.avatar || `https://i.pravatar.cc/40?u=${t.userId}`}" style="width:30px;height:30px;border-radius:50%;">
                            <span>${t.name || 'Team Member'}</span>
                        </label>
                    `).join('');
                }
            } else {
                groupMembersList.innerHTML = '<p class="text-secondary text-sm">No team members available.</p>';
            }
        });

        if (confirmGroupBtn) {
            confirmGroupBtn.addEventListener('click', async () => {
                const name = groupChatName ? groupChatName.value.trim() : '';
                if (!name) {
                    showNotification('Please enter a group name', 'error');
                    return;
                }

                // Get selected members
                const checkboxes = document.querySelectorAll('.group-member-checkbox:checked');
                const memberIds = Array.from(checkboxes).map(cb => cb.value);

                if (memberIds.length === 0) {
                    showNotification('Please select at least one team member', 'error');
                    return;
                }

                try {
                    const res = await apiFetch('/messages/group', {
                        method: 'POST',
                        body: JSON.stringify({ groupName: name, memberIds })
                    });
                    showNotification('Group chat created successfully!');
                    hideGroupModal();
                    loadConversations();
                    openChat(res.conversation._id);
                } catch (err) {
                    showNotification(err.message, 'error');
                }
            });
        }
    }

    // ── Render pending requests (received) ────────────────────────────────────
    function renderRequests() {
        const pending = conversations.filter(c =>
            c.status === 'pending' &&
            c.requestedBy !== currentUser._id &&
            (c.requestedBy?._id || c.requestedBy) !== currentUser._id
        );

        if (!requestsSection) return;
        if (pending.length === 0) { requestsSection.style.display = 'none'; return; }
        requestsSection.style.display = 'block';

        requestsList.innerHTML = pending.map(c => {
            const other = c.participants.find(p => (p._id || p) !== currentUser._id);
            const name  = other?.name || 'Unknown';
            const img   = other?.profileImage || `https://i.pravatar.cc/40?u=${other?._id}`;
            return `
                <div class="request-item glass-panel hover-lift animate-fade-in" data-id="${c._id}" style="border-radius:var(--radius-lg); margin-bottom: 12px; padding: 15px;">
                    <div class="avatar-ring"><img src="${img}" alt="${name}" style="width:40px;height:40px;object-fit:cover;"></div>
                    <div class="request-info" style="margin-left:12px;">
                        <div class="request-name" style="color:var(--primary-color);font-weight:600;">${name}</div>
                        <div class="request-preview" style="color:var(--text-secondary);">${c.requestMessage || ''}</div>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary accept-btn" data-id="${c._id}" style="padding:4px 12px;font-size:0.8rem;">Accept</button>
                        <button class="btn btn-outline decline-btn" data-id="${c._id}" style="padding:4px 12px;font-size:0.8rem;">Decline</button>
                    </div>
                </div>`;
        }).join('');

        requestsList.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', () => acceptRequest(btn.dataset.id));
        });
        requestsList.querySelectorAll('.decline-btn').forEach(btn => {
            btn.addEventListener('click', () => declineRequest(btn.dataset.id));
        });
    }

    // ── Render accepted chat list ─────────────────────────────────────────────
    function renderChatList() {
        if (!chatList) return;
        const accepted = conversations.filter(c => c.status === 'accepted');

        chatList.innerHTML = accepted.length ? accepted.map(c => {
            let name, img, online, lastSeen;
            if (c.isGroup) {
                name = c.groupName || 'Team Group Chat';
                img  = 'https://ui-avatars.com/api/?name=Team&background=random';
                online = false;
                lastSeen = '';
            } else {
                const other = c.participants.find(p => (p._id || p) !== currentUser._id);
                name     = other?.name || 'Unknown';
                img      = other?.profileImage || `https://i.pravatar.cc/40?u=${other?._id}`;
                online   = other?.isOnline;
                lastSeen = !online && other?.lastSeen ? formatLastSeen(other.lastSeen) : '';
            }

            const lastMsg  = c.lastMessageText || 'No messages yet';
            const isActive = c._id === activeConvoId;

            return `
                <div class="chat-item ${isActive?'active':''} hover-lift animate-fade-in" data-id="${c._id}" style="padding:12px;border-radius:var(--radius-md);margin-bottom:8px;${isActive ? 'background:linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color:white;' : ''}">
                    <div style="position:relative;">
                        <div class="avatar-ring" style="padding:2px;"><img src="${img}" alt="${name}" style="width:40px;height:40px;object-fit:cover;"></div>
                        ${online ? '<span style="position:absolute;bottom:0;right:0;width:12px;height:12px;background:#10b981;border-radius:50%;border:2px solid var(--surface-color);"></span>' : ''}
                    </div>
                    <div class="chat-info" style="margin-left:12px;">
                        <div class="chat-name" style="font-weight:600;${isActive ? 'color:white;' : 'color:var(--text-primary);'}">${name}</div>
                        <div class="chat-last-msg">${online ? '<span style="color:#10b981;font-size:0.75rem;font-weight:600;">Online</span>' : (lastSeen ? `<span style="font-size:0.75rem;${isActive ? 'color:rgba(255,255,255,0.8);' : 'color:var(--text-secondary);'}">Last seen ${lastSeen}</span>` : `<span style="${isActive ? 'color:rgba(255,255,255,0.8);' : 'color:var(--text-secondary);'}">${lastMsg}</span>`)}</div>
                    </div>
                </div>`;
        }).join('') : '<p class="text-sm text-secondary p-3">No conversations yet.</p>';

        chatList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => openChat(item.dataset.id));
        });
    }

    // ── Open accepted chat ────────────────────────────────────────────────────
    async function openChat(convoId) {
        activeConvoId = convoId;
        renderChatList();

        try {
            const data  = await apiFetch(`/messages/${convoId}`);
            const convo = data.conversation;
            
            if (convo.isGroup) {
                if (chatAvatar) chatAvatar.src = 'https://ui-avatars.com/api/?name=Team&background=random';
                if (chatName)   chatName.textContent = convo.groupName || 'Team Group Chat';
            } else {
                const other = convo.participants.find(p => p._id !== currentUser._id);
                if (chatAvatar) chatAvatar.src       = other?.profileImage || `https://i.pravatar.cc/40?u=${other?._id}`;
                if (chatName)   chatName.textContent = other?.name || 'Unknown';
            }

            renderMessages(convo.messages, convo.isGroup, convo.participants);
            if (messageInput) messageInput.focus();

            // Poll for new messages every 5s
            clearInterval(pollInterval);
            pollInterval = setInterval(() => pollMessages(convoId), 5000);
        } catch (err) { console.error('openChat:', err); }
    }

    // ── Open new chat (no existing conversation) ──────────────────────────────
    async function openNewChat(targetUserId) {
        activeConvoId = null;
        clearInterval(pollInterval);
        try {
            const data = await apiFetch(`/users/${targetUserId}`);
            const user = data.user;
            if (chatAvatar) chatAvatar.src       = user.profileImage || `https://i.pravatar.cc/40?u=${user._id}`;
            if (chatName)   chatName.textContent = user.name;
            if (chatMessages) chatMessages.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Write a message to start a conversation.</p>';
        } catch {}
    }

    // ── Render messages ───────────────────────────────────────────────────────
    function renderMessages(messages, isGroupChat = false, participants = []) {
        if (!chatMessages) return;
        chatMessages.innerHTML = messages.map(msg => {
            const isSent = msg.senderId === currentUser._id || (msg.senderId?._id || msg.senderId) === currentUser._id;
            const time   = new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
            
            let senderNameHtml = '';
            if (!isSent && isGroupChat) {
                const senderIdStr = msg.senderId?._id || msg.senderId;
                const sender = participants.find(p => p._id === senderIdStr);
                const name = sender ? sender.name : 'Unknown';
                senderNameHtml = `<div style="font-size:0.75rem; color:var(--primary-color); margin-bottom:2px; font-weight:600;">${name}</div>`;
            }

            return `
                <div class="message-bubble ${isSent?'sent':'received'}">
                    ${senderNameHtml}
                    ${msg.text}
                    <div class="message-time ${isSent?'sent':'received'}">${time}${isSent && msg.isRead ? ' ✓✓' : ''}</div>
                </div>`;
        }).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ── Poll for new messages ─────────────────────────────────────────────────
    async function pollMessages(convoId) {
        if (!activeConvoId || activeConvoId !== convoId) return;
        try {
            const data = await apiFetch(`/messages/${convoId}`);
            renderMessages(data.conversation.messages, data.conversation.isGroup, data.conversation.participants);
        } catch {}
    }

    // ── Send message ──────────────────────────────────────────────────────────
    async function sendMessage() {
        const text = messageInput ? messageInput.value.trim() : '';
        if (!text) return;

        if (activeConvoId) {
            try {
                await apiFetch(`/messages/${activeConvoId}`, { method:'POST', body: JSON.stringify({ message: text }) });
                messageInput.value = '';
                const data = await apiFetch(`/messages/${activeConvoId}`);
                renderMessages(data.conversation.messages, data.conversation.isGroup, data.conversation.participants);
                loadConversations();
            } catch (err) { showNotification(err.message, 'error'); }
        } else if (initialUserId) {
            // Send initial request message
            try {
                const data = await apiFetch('/messages/request', { method:'POST', body: JSON.stringify({ receiverId: initialUserId, message: text }) });
                messageInput.value = '';
                if (data.alreadyExists) {
                    activeConvoId = data.conversation._id;
                    await openChat(activeConvoId);
                } else {
                    showNotification('Message request sent! Waiting for approval.');
                    if (chatMessages) chatMessages.innerHTML = `<div class="message-bubble sent">${text}<div class="message-time sent">Just now</div></div>`;
                    loadConversations();
                }
            } catch (err) { showNotification(err.message, 'error'); }
        }
    }

    if (sendBtn)      sendBtn.addEventListener('click', sendMessage);
    if (messageInput) messageInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

    // ── Accept / Decline request ──────────────────────────────────────────────
    async function acceptRequest(convoId) {
        try {
            await apiFetch(`/messages/${convoId}/accept`, { method:'PUT' });
            showNotification('Request accepted!');
            await loadConversations();
            openChat(convoId);
        } catch (err) { showNotification(err.message, 'error'); }
    }

    async function declineRequest(convoId) {
        try {
            await apiFetch(`/messages/${convoId}/decline`, { method:'PUT' });
            showNotification('Request declined.');
            loadConversations();
        } catch (err) { showNotification(err.message, 'error'); }
    }

    // Cleanup polling on page leave
    window.addEventListener('beforeunload', () => clearInterval(pollInterval));

    loadConversations();
});
