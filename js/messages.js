// messages.js
document.addEventListener('DOMContentLoaded', () => {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let messages = JSON.parse(localStorage.getItem('messages')) || [];
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

    function renderChatList() {
        const otherUsers = users.filter(user => user.id !== currentUser.id);
        let html = '';

        otherUsers.forEach(user => {
            const conversationMessages = messages.filter(msg =>
                (msg.senderId === currentUser.id && msg.receiverId === user.id) ||
                (msg.senderId === user.id && msg.receiverId === currentUser.id)
            ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            const lastMessage = conversationMessages[conversationMessages.length - 1];
            const lastMsgText = lastMessage ? lastMessage.text : 'No messages yet';
            const isActive = activeChatUserId === user.id;

            html += `
                <div class="chat-item ${isActive ? 'active' : ''}" data-user-id="${user.id}">
                    <img src="${user.avatar}" alt="${user.name}">
                    <div class="chat-info">
                        <div class="chat-name">${user.name}</div>
                        <div class="chat-last-msg">${lastMsgText}</div>
                    </div>
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