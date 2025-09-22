/**
 * Chat JavaScript - Llama AI Sağlık Asistanı
 * Streaming chat, mesaj yönetimi ve sağlık verisi entegrasyonu
 */

// API ayarları
const API_BASE_URL = 'http://localhost:5000';
const CHAT_ENDPOINTS = {
    status: `${API_BASE_URL}/api/chat/status`,
    chat: `${API_BASE_URL}/api/chat`,
    stream: `${API_BASE_URL}/api/chat/stream`,
    recommendations: `${API_BASE_URL}/api/health-recommendations`
};

// Global değişkenler
let isTyping = false;
let currentStream = null;
let healthContext = window.healthContext || null;
let chatHistory = [];

// DOM elementleri
let chatMessages, chatInput, sendButton, statusDot, statusText;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    checkServiceStatus();
    loadChatHistory();
    setupEventListeners();
});

/**
 * Chat'i başlat
 */
function initializeChat() {
    // DOM elementlerini al
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendButton = document.getElementById('sendButton');
    statusDot = document.getElementById('statusDot');
    statusText = document.getElementById('statusText');
    
    // Textarea otomatik yükseklik ayarı
    setupAutoResizeTextarea();
    
    console.log('Chat başlatıldı');
}

/**
 * Servis durumunu kontrol et
 */
async function checkServiceStatus() {
    try {
        const response = await fetch(CHAT_ENDPOINTS.status);
        const data = await response.json();
        
        if (data.success) {
            const status = data.status;
            updateStatusIndicator(
                status.ollama_running && status.model_available,
                status.ollama_running ? 
                    (status.model_available ? 'Llama AI Aktif' : 'Model Yükleniyor...') :
                    'Ollama Bağlanamadı'
            );
        } else {
            updateStatusIndicator(false, 'Servis Hatası');
        }
    } catch (error) {
        console.error('Status kontrol hatası:', error);
        updateStatusIndicator(false, 'Bağlantı Hatası');
    }
}

/**
 * Durum göstergesini güncelle
 */
function updateStatusIndicator(isOnline, statusMessage) {
    if (statusDot && statusText) {
        statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
        statusText.textContent = statusMessage;
    }
}

/**
 * Event listener'ları ayarla
 */
function setupEventListeners() {
    // Send button
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    
    // Enter tuşu ile gönder
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        // Input değişikliklerini dinle
        chatInput.addEventListener('input', function() {
            const isEmpty = this.value.trim() === '';
            sendButton.disabled = isEmpty || isTyping;
        });
    }
    
    // Hızlı sorular
    const quickQuestions = document.querySelectorAll('.quick-question');
    quickQuestions.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.dataset.question;
            if (question && !isTyping) {
                chatInput.value = question;
                handleSendMessage();
            }
        });
    });
    
    // Sayfa yenileme uyarısı
    window.addEventListener('beforeunload', function(e) {
        if (chatHistory.length > 1) { // Welcome message'ı sayma
            e.preventDefault();
            e.returnValue = 'Chat geçmişiniz kaybolacak. Çıkmak istediğinizden emin misiniz?';
        }
    });
}

/**
 * Textarea otomatik yükseklik
 */
function setupAutoResizeTextarea() {
    if (!chatInput) return;
    
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        const newHeight = Math.min(this.scrollHeight, 120); // max 120px
        this.style.height = newHeight + 'px';
    });
}

/**
 * Mesaj gönder
 */
async function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message || isTyping) return;
    
    // Kullanıcı mesajını ekle
    addMessage('user', message);
    
    // Input'u temizle
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendButton.disabled = true;
    
    // Chat geçmişine ekle
    chatHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });
    
    // Typing indicator'ı göster
    showTypingIndicator();
    
    try {
        // Streaming response al
        await getStreamingResponse(message);
    } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        hideTypingIndicator();
        addMessage('assistant', '❌ Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.');
    }
    
    // Chat geçmişini kaydet
    saveChatHistory();
}

/**
 * Context ile mesaj gönder (Global fonksiyon)
 */
window.sendMessageWithContext = async function(message, context) {
    if (isTyping) return;
    
    // Context'i kaydet
    if (context) {
        healthContext = context;
    }
    
    // Kullanıcı mesajını ekle
    addMessage('user', message);
    
    // Chat geçmişine ekle
    chatHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        context: context
    });
    
    // Typing indicator'ı göster
    showTypingIndicator();
    
    try {
        await getStreamingResponse(message, context);
    } catch (error) {
        console.error('Context mesaj hatası:', error);
        hideTypingIndicator();
        addMessage('assistant', '❌ Bir hata oluştu. Lütfen tekrar deneyin.');
    }
    
    saveChatHistory();
};

/**
 * Streaming response al
 */
async function getStreamingResponse(message, context = null) {
    isTyping = true;
    
    const requestBody = {
        message: message,
        context: context || healthContext
    };
    
    try {
        const response = await fetch(CHAT_ENDPOINTS.stream, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Typing indicator'ı gizle
        hideTypingIndicator();
        
        // Boş assistant mesajı oluştur
        const assistantMessage = addMessage('assistant', '');
        const messageContentDiv = assistantMessage.querySelector('.message-bubble');
        
        // Stream'i okumaya başla
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (let line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr.trim()) {
                        try {
                            const data = JSON.parse(jsonStr);
                            
                            if (data.error) {
                                throw new Error(data.error);
                            }
                            
                            if (data.chunk && !data.done) {
                                fullResponse += data.chunk;
                                messageContentDiv.innerHTML = formatMessage(fullResponse);
                                scrollToBottom();
                            }
                            
                            if (data.done) {
                                break;
                            }
                            
                        } catch (e) {
                            if (jsonStr !== '') {
                                console.warn('JSON parse hatası:', e, jsonStr);
                            }
                        }
                    }
                }
            }
        }
        
        // Chat geçmişine assistant cevabını ekle
        chatHistory.push({
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        hideTypingIndicator();
        console.error('Streaming hatası:', error);
        
        // Fallback: Normal API'yi dene
        try {
            await getFallbackResponse(message, context);
        } catch (fallbackError) {
            console.error('Fallback hatası:', fallbackError);
            addMessage('assistant', '❌ Şu anda teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.');
        }
    } finally {
        isTyping = false;
        sendButton.disabled = false;
    }
}

/**
 * Fallback normal response
 */
async function getFallbackResponse(message, context = null) {
    const requestBody = {
        message: message,
        context: context || healthContext
    };
    
    const response = await fetch(CHAT_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
        addMessage('assistant', data.response);
        
        chatHistory.push({
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString()
        });
    } else {
        throw new Error(data.error || 'API hatası');
    }
}

/**
 * Mesaj ekle
 */
function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const currentTime = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${role === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-bubble">${formatMessage(content)}</div>
            <div class="message-time">${currentTime}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    return messageDiv;
}

/**
 * Mesajı formatla (Markdown ve emoji desteği)
 */
function formatMessage(content) {
    if (!content) return '';
    
    let formatted = content
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Line breaks
        .replace(/\n/g, '<br>')
        // Lists (basit)
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return formatted;
}

/**
 * Typing indicator göster
 */
function showTypingIndicator() {
    isTyping = true;
    sendButton.disabled = true;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

/**
 * Typing indicator gizle
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * En alta scroll
 */
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Chat geçmişini kaydet
 */
function saveChatHistory() {
    try {
        localStorage.setItem('obesityChat_history', JSON.stringify(chatHistory));
        localStorage.setItem('obesityChat_context', JSON.stringify(healthContext));
    } catch (error) {
        console.warn('Chat geçmişi kaydedilemedi:', error);
    }
}

/**
 * Chat geçmişini yükle
 */
function loadChatHistory() {
    try {
        const savedHistory = localStorage.getItem('obesityChat_history');
        const savedContext = localStorage.getItem('obesityChat_context');
        
        if (savedHistory) {
            chatHistory = JSON.parse(savedHistory);
            
            // Sadece kullanıcı ve assistant mesajlarını yükle (welcome message hariç)
            chatHistory.forEach(msg => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    // Bu kez mesaj zaman bilgisi ile eklenmeyecek, kaydedilmiş zaman kullanılacak
                    const messageDiv = createMessageFromHistory(msg);
                    if (messageDiv) {
                        chatMessages.appendChild(messageDiv);
                    }
                }
            });
        }
        
        if (savedContext) {
            healthContext = JSON.parse(savedContext);
        }
        
        scrollToBottom();
        
    } catch (error) {
        console.warn('Chat geçmişi yüklenemedi:', error);
        chatHistory = [];
    }
}

/**
 * Geçmişten mesaj oluştur
 */
function createMessageFromHistory(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.role}`;
    
    const messageTime = new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-bubble">${formatMessage(msg.content)}</div>
            <div class="message-time">${messageTime}</div>
        </div>
    `;
    
    return messageDiv;
}

/**
 * Chat'i temizle
 */
function clearChat() {
    if (confirm('Tüm chat geçmişi silinecek. Emin misiniz?')) {
        chatHistory = [];
        healthContext = null;
        localStorage.removeItem('obesityChat_history');
        localStorage.removeItem('obesityChat_context');
        
        // Sadece welcome message'ı bırak
        const messages = chatMessages.querySelectorAll('.message:not(:first-child)');
        messages.forEach(msg => msg.remove());
        
        console.log('Chat geçmişi temizlendi');
    }
}

/**
 * Sağlık analizi iste (Ana sayfadan geldiğinde)
 */
async function requestHealthAnalysis() {
    if (!healthContext) {
        addMessage('assistant', '❌ Sağlık verisi bulunamadı. Lütfen önce ana sayfada obezite tahmini yaptırın.');
        return;
    }
    
    const analysisMessage = `Sağlık verilerimi analiz edip kişiselleştirilmiş öneriler verir misin?
    
📊 **Verilerim:**
- BMI: ${healthContext.prediction?.bmi}
- Durum: ${healthContext.prediction?.predicted_class}
- Güven: %${healthContext.prediction?.confidence}

Detaylı öneriler bekliyorum! 😊`;

    // Input'a yaz ve gönder
    if (chatInput) {
        chatInput.value = analysisMessage;
        handleSendMessage();
    }
}

// Global fonksiyonları export et
window.clearChat = clearChat;
window.requestHealthAnalysis = requestHealthAnalysis;
window.checkServiceStatus = checkServiceStatus;

// Periyodik status kontrolü
setInterval(checkServiceStatus, 30000); // 30 saniyede bir