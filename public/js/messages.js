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
                <div class="request-item" data-id="${c._id}">
                    <img src="${img}" alt="${name}">
                    <div class="request-info">
                        <div class="request-name">${name}</div>
                        <div class="request-preview">${c.requestMessage || ''}</div>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary accept-btn" data-id="${c._id}">Accept</button>
                        <button class="btn btn-outline decline-btn" data-id="${c._id}">Decline</button>
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
            const other    = c.participants.find(p => (p._id || p) !== currentUser._id);
            const name     = other?.name || 'Unknown';
            const img      = other?.profileImage || `https://i.pravatar.cc/40?u=${other?._id}`;
            const lastMsg  = c.lastMessageText || 'No messages yet';
            const isActive = c._id === activeConvoId;
            const online   = other?.isOnline;
            const lastSeen = !online && other?.lastSeen ? formatLastSeen(other.lastSeen) : '';

            return `
                <div class="chat-item ${isActive?'active':''}" data-id="${c._id}">
                    <div style="position:relative;">
                        <img src="${img}" alt="${name}">
                        ${online ? '<span style="position:absolute;bottom:0;right:0;width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid var(--card-bg);"></span>' : ''}
                    </div>
                    <div class="chat-info">
                        <div class="chat-name">${name}</div>
                        <div class="chat-last-msg">${online ? '<span style="color:#22c55e;font-size:0.75rem;">Online</span>' : (lastSeen ? `<span style="font-size:0.75rem;color:var(--text-secondary);">Last seen ${lastSeen}</span>` : lastMsg)}</div>
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
            const other = convo.participants.find(p => p._id !== currentUser._id);

            if (chatAvatar) chatAvatar.src       = other?.profileImage || `https://i.pravatar.cc/40?u=${other?._id}`;
            if (chatName)   chatName.textContent = other?.name || 'Unknown';

            renderMessages(convo.messages);
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
    function renderMessages(messages) {
        if (!chatMessages) return;
        chatMessages.innerHTML = messages.map(msg => {
            const isSent = msg.senderId === currentUser._id || (msg.senderId?._id || msg.senderId) === currentUser._id;
            const time   = new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
            return `
                <div class="message-bubble ${isSent?'sent':'received'}">
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
            renderMessages(data.conversation.messages);
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
                renderMessages(data.conversation.messages);
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
