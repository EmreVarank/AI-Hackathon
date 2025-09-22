// Obesity Prediction Web App JavaScript

const API_URL = 'http://localhost:5000';

// Global değişken - son tahmin sonucu
let lastPredictionResult = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('obesityForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            makePrediction();
        });
    }
    
    // Chat integration event listeners
    setupChatIntegration();
    
    // API health check
    setTimeout(checkAPIHealth, 1000);
});

/**
 * Quick prediction using only basic information
 */
function quickPredict() {
    const data = {
        gender: document.getElementById('gender').value,
        age: parseInt(document.getElementById('age').value),
        height: parseInt(document.getElementById('height').value),
        weight: parseFloat(document.getElementById('weight').value)
    };

    // Validate required fields
    if (!data.gender || !data.age || !data.height || !data.weight) {
        showResult('Lütfen temel bilgileri (cinsiyet, yaş, boy, kilo) doldurun!', 'error');
        return;
    }

    showLoading(true);
    
    fetch(`${API_URL}/quick-predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            // Sonucu global değişkende sakla
            lastPredictionResult = data;
            
            const result = `
                <h3>🎯 Hızlı Tahmin Sonucu</h3>
                <p><strong>BMI:</strong> ${data.prediction.bmi}</p>
                <p><strong>Tahmin:</strong> ${data.prediction.predicted_class}</p>
                <p><strong>Güven:</strong> %${data.prediction.confidence}</p>
                <p><em>Bu tahmin temel bilgiler kullanılarak yapılmıştır. Daha kesin sonuç için detaylı tahmini kullanın.</em></p>
            `;
            showResult(result, 'success');
            
            // Chat entegrasyonunu göster
            showChatIntegration();
        } else {
            showResult(`Hata: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        showLoading(false);
        showResult(`API Hatası: ${error.message}`, 'error');
    });
}

/**
 * Full prediction using all form data
 */
function makePrediction() {
    const data = {
        gender: document.getElementById('gender').value,
        age: parseInt(document.getElementById('age').value),
        height: parseInt(document.getElementById('height').value),
        weight: parseFloat(document.getElementById('weight').value),
        family_history: document.getElementById('family_history').value,
        favc: document.getElementById('favc').value,
        fcvc: parseInt(document.getElementById('fcvc').value),
        ncp: parseInt(document.getElementById('ncp').value),
        caec: document.getElementById('caec').value,
        smoke: document.getElementById('smoke').value,
        ch2o: parseInt(document.getElementById('ch2o').value),
        scc: document.getElementById('scc').value,
        faf: parseInt(document.getElementById('faf').value),
        tue: parseInt(document.getElementById('tue').value),
        calc: document.getElementById('calc').value,
        mtrans: document.getElementById('mtrans').value
    };

    showLoading(true);
    
    fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            // Sonucu global değişkende sakla
            lastPredictionResult = data;
            
            let probabilities = '';
            for (const [className, prob] of Object.entries(data.prediction.all_probabilities)) {
                probabilities += `<li>${className}: %${prob.toFixed(1)}</li>`;
            }

            const result = `
                <h3>🎯 Detaylı Tahmin Sonucu</h3>
                <p><strong>BMI:</strong> ${data.prediction.bmi}</p>
                <p><strong>Ana Tahmin:</strong> ${data.prediction.predicted_class}</p>
                <p><strong>Güven Oranı:</strong> %${data.prediction.confidence}</p>
                
                <h4>Tüm Sınıf Olasılıkları:</h4>
                <ul>${probabilities}</ul>
                
                <p><strong>Girilen Bilgiler:</strong></p>
                <p>Yaş: ${data.input_data.age}, Cinsiyet: ${data.input_data.gender}, 
                   Boy: ${data.input_data.height}cm, Kilo: ${data.input_data.weight}kg</p>
            `;
            showResult(result, 'success');
            
            // Chat entegrasyonunu göster
            showChatIntegration();
        } else {
            showResult(`Hata: ${data.error}`, 'error');
        }
    })
    .catch(error => {
        showLoading(false);
        showResult(`API Hatası: ${error.message}`, 'error');
    });
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}

/**
 * Display result message
 */
function showResult(message, type) {
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.innerHTML = message;
        resultDiv.className = `result ${type}`;
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Clear form and results
 */
function clearForm() {
    const form = document.getElementById('obesityForm');
    if (form) {
        form.reset();
    }
    
    const resultDiv = document.getElementById('result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
}

/**
 * API health check
 */
function checkAPIHealth() {
    fetch(`${API_URL}/`)
    .then(response => response.json())
    .then(data => {
        console.log('API Health:', data);
        if (!data.model_loaded) {
            showResult('⚠️ Model yüklenemedi. Lütfen backend\'i kontrol edin.', 'error');
        }
    })
    .catch(error => {
        console.error('API Health Check Failed:', error);
        showResult('⚠️ API\'ye bağlanılamıyor. Backend çalıştığından emin olun.', 'error');
    });
}

// Check API health on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(checkAPIHealth, 1000);
});

/**
 * Chat Integration Functions
 */
function setupChatIntegration() {
    const openChatBtn = document.getElementById('openChatBtn');
    const getRecommendationsBtn = document.getElementById('getRecommendationsBtn');
    
    if (openChatBtn) {
        openChatBtn.addEventListener('click', openChatWithResults);
    }
    
    if (getRecommendationsBtn) {
        getRecommendationsBtn.addEventListener('click', getQuickRecommendations);
    }
}

/**
 * Chat entegrasyonunu göster
 */
function showChatIntegration() {
    const chatIntegration = document.getElementById('chatIntegration');
    if (chatIntegration && lastPredictionResult) {
        chatIntegration.style.display = 'block';
    }
}

/**
 * Sonuçlarla birlikte chat'i aç
 */
function openChatWithResults() {
    if (!lastPredictionResult) {
        alert('Önce bir tahmin yapın!');
        return;
    }
    
    // Sağlık verilerini URL parameter olarak chat sayfasına gönder
    const healthData = encodeURIComponent(JSON.stringify(lastPredictionResult));
    const chatUrl = `chat.html?data=${healthData}`;
    
    // Yeni tab'da aç
    window.open(chatUrl, '_blank');
}

/**
 * Hızlı öneriler modal'ını aç
 */
async function getQuickRecommendations() {
    if (!lastPredictionResult) {
        alert('Önce bir tahmin yapın!');
        return;
    }
    
    // Modal oluştur
    const modal = createRecommendationsModal();
    document.body.appendChild(modal);
    
    try {
        // Backend'den önerileri al
        const response = await fetch(`${API_URL}/api/health-recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prediction: lastPredictionResult.prediction,
                user_input: lastPredictionResult.input_data
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Önerileri modal'da göster
            updateModalContent(modal, data.recommendations);
        } else {
            throw new Error(data.error || 'Öneriler alınamadı');
        }
        
    } catch (error) {
        console.error('Öneriler alınırken hata:', error);
        
        // Fallback: Basit öneriler göster
        const fallbackRecommendations = getFallbackRecommendations(
            lastPredictionResult.prediction.predicted_class,
            lastPredictionResult.prediction.bmi
        );
        updateModalContent(modal, fallbackRecommendations);
    }
}

/**
 * Öneriler modal'ı oluştur
 */
function createRecommendationsModal() {
    const modal = document.createElement('div');
    modal.className = 'recommendations-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🏥 Sağlık Önerileri</h3>
                <button class="close-modal" onclick="this.closest('.recommendations-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="loading-recommendations">
                    <div class="loading-spinner"></div>
                    <p>Kişiselleştirilmiş önerileriniz hazırlanıyor...</p>
                </div>
            </div>
        </div>
    `;
    
    // Modal dışına tıklayınca kapat
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    return modal;
}

/**
 * Modal içeriğini güncelle
 */
function updateModalContent(modal, recommendations) {
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div style="line-height: 1.6;">
            ${formatRecommendations(recommendations)}
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <button onclick="window.open('chat.html?data=${encodeURIComponent(JSON.stringify(lastPredictionResult))}', '_blank')" 
                    style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer;">
                🤖 Detaylı Sohbet için Asistan'a Git
            </button>
        </div>
    `;
}

/**
 * Önerileri formatla
 */
function formatRecommendations(recommendations) {
    if (typeof recommendations === 'string') {
        // Markdown-benzeri formatlamayı basit HTML'e çevir
        return recommendations
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^## (.*$)/gim, '<h3>$1</h3>')
            .replace(/^# (.*$)/gim, '<h2>$1</h2>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    }
    return recommendations;
}

/**
 * Fallback öneriler
 */
function getFallbackRecommendations(obesityClass, bmi) {
    const recommendations = {
        'Normal Weight': `
            <h4>🎉 Tebrikler! Sağlıklı kilonuz var</h4>
            <p><strong>BMI:</strong> ${bmi}</p>
            
            <h4>🥗 Beslenme Önerileri:</h4>
            <ul>
                <li>Dengeli beslenme alışkanlıklarınızı sürdürün</li>
                <li>Günde 5 porsiyon meyve-sebze tüketin</li>
                <li>Bol su için (günde 2-3 litre)</li>
                <li>İşlenmiş gıdalardan kaçının</li>
            </ul>
            
            <h4>🏃 Fiziksel Aktivite:</h4>
            <ul>
                <li>Haftada 150 dakika orta tempolu egzersiz</li>
                <li>Günlük 30 dakika yürüyüş idealdir</li>
                <li>Kuvvet antrenmanları ekleyin</li>
            </ul>
        `,
        'Overweight Level I': `
            <h4>⚠️ Hafif kilolu durumdasınız</h4>
            <p><strong>BMI:</strong> ${bmi}</p>
            
            <h4>🥗 Beslenme Stratejisi:</h4>
            <ul>
                <li>Porsiyon kontrolü yapın</li>
                <li>Şekerli içecekleri azaltın</li>
                <li>Tam tahıllı ürünleri tercih edin</li>
                <li>Protein ağırlıklı beslenin</li>
                <li>Sık sık az yiyin (5-6 öğün)</li>
            </ul>
            
            <h4>🏃 Egzersiz Programı:</h4>
            <ul>
                <li>Haftada 4-5 gün 45 dakika tempolu yürüyüş</li>
                <li>Kuvvet antrenmanları ekleyin</li>
                <li>Merdiven çıkmayı tercih edin</li>
                <li>Ayda 1-2 kg vermek hedefleyin</li>
            </ul>
        `,
        'Obesity Type I': `
            <h4>🚨 Tip 1 obezite durumundasınız</h4>
            <p><strong>BMI:</strong> ${bmi}</p>
            
            <h4>🥗 Beslenme Stratejisi:</h4>
            <ul>
                <li>Mutlaka diyetisyene danışın</li>
                <li>Kalori kısıtlaması gerekli</li>
                <li>İşlenmiş gıdalardan tamamen kaçının</li>
                <li>Sık sık az yiyin (6-7 öğün)</li>
                <li>Su tüketiminizi artırın</li>
            </ul>
            
            <h4>🏃 Egzersiz Programı:</h4>
            <ul>
                <li>Önce doktor onayı alın</li>
                <li>Düşük etkili egzersizlerle başlayın (yüzme, yürüyüş)</li>
                <li>Kademeli artırın</li>
                <li>Fizik tedavi uzmanından destek alın</li>
            </ul>
            
            <h4>⚠️ Önemli Uyarı:</h4>
            <p><strong>Mutlaka hekim kontrolünde hareket edin. Kan şekeri ve tansiyon takibi yapın.</strong></p>
        `
    };
    
    return recommendations[obesityClass] || `
        <h4>Sağlık Önerileri</h4>
        <p><strong>BMI:</strong> ${bmi}</p>
        <p>Durumunuz için özel öneriler almak adına bir sağlık uzmanına danışmanızı öneririz.</p>
        <p>Genel sağlık önerileri için sağlık asistanımızla konuşabilirsiniz.</p>
    `;
}