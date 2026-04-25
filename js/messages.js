// messages.js
document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let messages = JSON.parse(localStorage.getItem('messages')) || [];
    let chats = JSON.parse(localStorage.getItem(`chats_${currentUser ? currentUser.id : ''}`)) || [];
    let activeChatUserId = null;

    const chatList = document.getElementById('chat-list');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatAvatar = document.getElementById('chat-avatar');
    const chatName = document.getElementById('chat-name');

    // Check URL params for initial user
    const urlParams = new URLSearchParams(window.location.search);
    const initialUserId = urlParams.get('user');

    if (!currentUser) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }

    function saveMessages() {
        localStorage.setItem('messages', JSON.stringify(messages));
    }

    function saveChats() {
        localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(chats));
    }

    function updateChat(userId, lastMsg, lastTime) {
        let chat = chats.find(c => c.userId === userId);
        if (!chat) {
            chat = { userId, lastMessage: lastMsg, lastTime, unreadCount: 0, lastReadTime: '' };
            chats.push(chat);
        } else {
            chat.lastMessage = lastMsg;
            chat.lastTime = lastTime;
        }
        saveChats();
    }

    function renderChatList() {
        const otherUsers = users.filter(user => user.id !== currentUser.id);

        // Update chats
        otherUsers.forEach(user => {
            const convMsgs = messages.filter(msg =>
                (msg.senderId === currentUser.id && msg.receiverId === user.id) ||
                (msg.senderId === user.id && msg.receiverId === currentUser.id)
            ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const lastMsg = convMsgs[convMsgs.length - 1];
            let chat = chats.find(c => c.userId === user.id);
            if (!chat) {
                chat = {
                    userId: user.id,
                    lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
                    lastTime: lastMsg ? lastMsg.timestamp : '',
                    unreadCount: 0,
                    lastReadTime: ''
                };
                chats.push(chat);
            } else {
                if (lastMsg && new Date(lastMsg.timestamp) > new Date(chat.lastTime || 0)) {
                    chat.lastMessage = lastMsg.text;
                    chat.lastTime = lastMsg.timestamp;
                }
                // Recalculate unreadCount
                const lastRead = new Date(chat.lastReadTime || 0);
                chat.unreadCount = convMsgs.filter(msg => msg.senderId === user.id && new Date(msg.timestamp) > lastRead).length;
            }
        });
        saveChats();

        // Sort chats by lastTime descending
        chats.sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));

        // Render
        let html = '';
        chats.forEach(chat => {
            const user = users.find(u => u.id === chat.userId);
            if (!user) return;
            const isActive = activeChatUserId === chat.userId;
            const unread = chat.unreadCount;
            html += `
                <div class="chat-item ${isActive ? 'active' : ''} ${unread > 0 ? 'unread' : ''}" data-user-id="${chat.userId}">
                    <img src="${user.avatar}" alt="${user.name}">
                    <div class="chat-info">
                        <div class="chat-name">${user.name}</div>
                        <div class="chat-last-msg">${chat.lastMessage}</div>
                    </div>
                    ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
                </div>
            `;
        });

        chatList.innerHTML = html;

        // Add click listeners
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = parseInt(item.dataset.userId);
                openChat(userId);
            });
        });
    }

    function openChat(userId) {
        activeChatUserId = userId;
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Reset unread
        const chat = chats.find(c => c.userId === userId);
        if (chat) {
            chat.unreadCount = 0;
            chat.lastReadTime = new Date().toISOString();
            saveChats();
        }

        chatAvatar.src = user.avatar;
        chatName.textContent = user.name;

        renderChatList();
        renderMessages();
        messageInput.focus();
    }

    function renderMessages() {
        if (!activeChatUserId) {
            chatMessages.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Select a conversation to start chatting</p>';
            return;
        }

        const conversationMessages = messages.filter(msg =>
            (msg.senderId === currentUser.id && msg.receiverId === activeChatUserId) ||
            (msg.senderId === activeChatUserId && msg.receiverId === currentUser.id)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        let html = '';
        conversationMessages.forEach(msg => {
            const isSent = msg.senderId === currentUser.id;
            const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            html += `
                <div class="message-bubble ${isSent ? 'sent' : 'received'}">
                    ${msg.text}
                    <div class="message-time ${isSent ? 'sent' : 'received'}">${time}</div>
                </div>
            `;
        });

        chatMessages.innerHTML = html;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !activeChatUserId) return;

        const newMessage = {
            id: Date.now(),
            senderId: currentUser.id,
            receiverId: activeChatUserId,
            text: text,
            timestamp: new Date().toISOString()
        };

        messages.push(newMessage);
        saveMessages();
        updateChat(activeChatUserId, newMessage.text, newMessage.timestamp);
        messageInput.value = '';
        renderMessages();
        renderChatList(); // Update last message
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial render
    renderChatList();

    // Open initial chat if specified
    if (initialUserId) {
        const userId = parseInt(initialUserId);
        if (users.some(u => u.id === userId)) {
            openChat(userId);
        }
    }
});