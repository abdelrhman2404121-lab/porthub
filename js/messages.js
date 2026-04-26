// messages.js
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let chats = JSON.parse(localStorage.getItem('chats')) || {};
    let requests = JSON.parse(localStorage.getItem('requests')) || {};
    let activeChatId = null;
    let pendingReceiverId = null;

    const chatList = document.getElementById('chat-list');
    const requestsSection = document.getElementById('requests-section');
    const requestsList = document.getElementById('requests-list');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatAvatar = document.getElementById('chat-avatar');
    const chatName = document.getElementById('chat-name');

    const urlParams = new URLSearchParams(window.location.search);
    const initialUserId = urlParams.get('user') ? parseInt(urlParams.get('user')) : null;

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    function saveData() {
        localStorage.setItem('chats', JSON.stringify(chats));
        localStorage.setItem('requests', JSON.stringify(requests));
    }

    function generateId() {
        return Date.now().toString() + Math.random().toString(36).slice(2, 5);
    }

    function showNotification(message) {
        alert(message);
    }

    function renderRequests() {
        const incomingRequests = Object.values(requests).filter(req => req.receiver === currentUser.id);
        if (incomingRequests.length === 0) {
            requestsSection.style.display = 'none';
            return;
        }

        requestsSection.style.display = 'block';
        let html = '';
        incomingRequests.forEach(req => {
            const sender = users.find(u => u.id === req.sender);
            if (!sender) return;
            html += `
                <div class="request-item" data-request-id="${req.id}">
                    <img src="${sender.avatar}" alt="${sender.name}">
                    <div class="request-info">
                        <div class="request-name">${sender.name}</div>
                        <div class="request-preview">${req.message}</div>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-primary accept-btn">Accept</button>
                        <button class="btn btn-outline decline-btn">Decline</button>
                    </div>
                </div>
            `;
        });
        requestsList.innerHTML = html;

        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const requestId = e.target.closest('.request-item').dataset.requestId;
                acceptRequest(requestId);
            });
        });

        document.querySelectorAll('.decline-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const requestId = e.target.closest('.request-item').dataset.requestId;
                declineRequest(requestId);
            });
        });
    }

    function acceptRequest(requestId) {
        const request = requests[requestId];
        if (!request || request.receiver !== currentUser.id) return;

        let chatId = request.chatId;
        if (!chatId || !chats[chatId]) {
            chatId = generateId();
            chats[chatId] = {
                users: [request.sender, request.receiver],
                messages: [{
                    id: generateId(),
                    senderId: request.sender,
                    text: request.message,
                    timestamp: request.time
                }],
                lastTime: request.time,
                accepted: true,
                createdBy: request.sender,
                lastReadTime: Date.now()
            };
        } else {
            chats[chatId].accepted = true;
            chats[chatId].lastTime = request.time;
        }

        delete requests[requestId];
        saveData();
        renderRequests();
        renderChatList();
        openChat(chatId);
    }

    function declineRequest(requestId) {
        const request = requests[requestId];
        if (!request || request.receiver !== currentUser.id) return;

        if (request.chatId && chats[request.chatId] && !chats[request.chatId].accepted) {
            delete chats[request.chatId];
        }

        delete requests[requestId];
        saveData();
        renderRequests();
        renderChatList();
    }

    function renderChatList() {
        const userChats = Object.entries(chats).filter(([chatId, chat]) =>
            chat.users.includes(currentUser.id) && chat.accepted
        );

        userChats.sort((a, b) => b[1].lastTime - a[1].lastTime);

        let html = '';
        userChats.forEach(([chatId, chat]) => {
            const otherUserId = chat.users.find(id => id !== currentUser.id);
            const otherUser = users.find(u => u.id === otherUserId);
            if (!otherUser) return;

            const lastMessage = chat.messages[chat.messages.length - 1];
            const lastMsgText = lastMessage ? lastMessage.text : 'No messages yet';
            const lastReadTime = chat.lastReadTime || 0;
            const unreadCount = chat.messages.filter(msg => msg.senderId === otherUserId && msg.timestamp > lastReadTime).length;
            const isActive = activeChatId === chatId;

            html += `
                <div class="chat-item ${isActive ? 'active' : ''} ${unreadCount > 0 ? 'unread' : ''}" data-chat-id="${chatId}">
                    <img src="${otherUser.avatar}" alt="${otherUser.name}">
                    <div class="chat-info">
                        <div class="chat-name">${otherUser.name}${unreadCount > 0 ? ` <span class="unread-badge">${unreadCount}</span>` : ''}</div>
                        <div class="chat-last-msg">${lastMsgText}</div>
                    </div>
                </div>
            `;
        });

        chatList.innerHTML = html;
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                openChat(item.dataset.chatId);
            });
        });
    }

    function openChat(chatId) {
        const chat = chats[chatId];
        if (!chat || !chat.users.includes(currentUser.id) || !chat.accepted) return;

        activeChatId = chatId;
        pendingReceiverId = null;
        const otherUserId = chat.users.find(id => id !== currentUser.id);
        const otherUser = users.find(u => u.id === otherUserId);
        if (!otherUser) return;

        chat.lastReadTime = Date.now();
        saveData();

        chatAvatar.src = otherUser.avatar;
        chatName.textContent = otherUser.name;
        renderChatList();
        renderMessages();
        messageInput.focus();
    }

    function openPendingChat(receiverId) {
        activeChatId = null;
        pendingReceiverId = receiverId;
        const user = users.find(u => u.id === receiverId);
        if (!user) return;

        chatAvatar.src = user.avatar;
        chatName.textContent = user.name;
        renderChatList();
        renderMessages();
        messageInput.focus();
    }

    function renderMessages() {
        if (activeChatId) {
            const chat = chats[activeChatId];
            if (!chat) return;

            let html = '';
            chat.messages.forEach(msg => {
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
            return;
        }

        if (pendingReceiverId) {
            const existingRequest = Object.values(requests).find(req => req.sender === currentUser.id && req.receiver === pendingReceiverId);
            let html = '';
            if (existingRequest) {
                html = `
                    <div class="message-bubble sent">
                        ${existingRequest.message}
                        <div class="message-time sent">${new Date(existingRequest.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                `;
            }
            if (!html) {
                html = '<p style="text-align: center; color: var(--text-secondary);">Write a message to send a request.</p>';
            }
            chatMessages.innerHTML = html;
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return;
        }

        chatMessages.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Select a conversation to start chatting</p>';
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        if (activeChatId) {
            const chat = chats[activeChatId];
            if (!chat) return;

            const newMessage = {
                id: generateId(),
                senderId: currentUser.id,
                text,
                timestamp: Date.now()
            };
            chat.messages.push(newMessage);
            chat.lastTime = newMessage.timestamp;
            saveData();
            messageInput.value = '';
            renderMessages();
            renderChatList();
            return;
        }

        if (pendingReceiverId) {
            const existingRequest = Object.values(requests).find(req => req.sender === currentUser.id && req.receiver === pendingReceiverId);
            if (existingRequest) {
                existingRequest.message = text;
                existingRequest.time = Date.now();
            } else {
                const requestId = generateId();
                requests[requestId] = {
                    id: requestId,
                    sender: currentUser.id,
                    receiver: pendingReceiverId,
                    message: text,
                    time: Date.now(),
                    chatId: null
                };
            }

            saveData();
            renderMessages();
            renderRequests();
            renderChatList();
            messageInput.value = '';
            showNotification('Message request sent. Waiting for approval.');
            return;
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    renderRequests();
    renderChatList();

    if (initialUserId) {
        const existingChatId = Object.keys(chats).find(chatId => {
            const chat = chats[chatId];
            return chat.users.includes(currentUser.id) && chat.users.includes(initialUserId);
        });

        if (existingChatId) {
            openChat(existingChatId);
        } else {
            openPendingChat(initialUserId);
        }
    }
});
