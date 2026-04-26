/* js/chatbot.js */
(function() {
  const CONFIG = {
    API_KEY: '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',
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    MODEL: 'llama-3.3-70b-versatile',
    MAX_HISTORY: 10
  };

  const STORAGE_KEY = 'ph_ai_chat_history_v1';
  const SYSTEM_PROMPT = `You are an expert Career & Portfolio Advisor for software developers. Respond exclusively in polished, professional English. Provide accurate, actionable guidance on interviews, salary negotiation, remote work, skill roadmaps, freelance contracts, and portfolio optimization. Keep responses concise but thorough. Never break character.`;

  let conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

  const els = {
    toggle: document.getElementById('ph-chat-toggle'),
    window: document.getElementById('ph-chat-window'),
    close:  document.getElementById('ph-chat-close'),
    msgs:   document.getElementById('ph-chat-messages'),
    input:  document.getElementById('ph-chat-input'),
    send:   document.getElementById('ph-chat-send')
  };

  function init() {
    if (!els.toggle) return console.warn('Chatbot: HTML elements not found. Ensure the widget snippet is placed before this script.');
    loadHistory();
    bindEvents();
  }

  function bindEvents() {
    els.toggle.addEventListener('click', () => {
      els.window.classList.toggle('ph-chat-hidden');
      if (!els.window.classList.contains('ph-chat-hidden')) els.input.focus();
    });
    els.close.addEventListener('click', () => els.window.classList.add('ph-chat-hidden'));
    els.send.addEventListener('click', handleSend);
    els.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
  }

  async function handleSend() {
    const text = els.input.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    els.input.value = '';
    els.send.disabled = true;
    els.send.textContent = '';

    const typing = appendMessage('analyzing...', 'bot typing');

    try {
      conversationHistory.push({ role: 'user', content: text });
      if (conversationHistory.length > CONFIG.MAX_HISTORY + 1) {
        conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-CONFIG.MAX_HISTORY)];
      }

      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CONFIG.MODEL,
          messages: conversationHistory,
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { message: 'API request failed' } }));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.choices[0].message.content.trim();

      typing.remove();
      appendMessage(aiReply, 'bot');

      conversationHistory.push({ role: 'assistant', content: aiReply });
      saveHistory();

    } catch (error) {
      typing.remove();
      appendMessage(`⚠️ Connection issue: ${error.message}.`, 'bot');
      console.error('Chatbot Error:', error);
    } finally {
      els.send.disabled = false;
      els.send.textContent = '➤';
      els.input.focus();
    }
  }

  function appendMessage(text, type) {
    const div = document.createElement('div');
    div.className = `ph-msg ${type}`;
    div.textContent = text;
    els.msgs.appendChild(div);
    els.msgs.scrollTop = els.msgs.scrollHeight;
    return div;
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const userAssistant = saved.filter(m => m.role !== 'system');
      conversationHistory = [conversationHistory[0], ...userAssistant.slice(-CONFIG.MAX_HISTORY)];
      userAssistant.forEach(m => appendMessage(m.content, m.role === 'assistant' ? 'bot' : 'user'));
    } catch(e) {}
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory));
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); 