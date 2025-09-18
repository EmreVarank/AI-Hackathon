// Obesity Prediction Web App JavaScript

const API_URL = 'http://localhost:5000';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('obesityForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            makePrediction();
        });
    }
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
            const result = `
                <h3>🎯 Hızlı Tahmin Sonucu</h3>
                <p><strong>BMI:</strong> ${data.prediction.bmi}</p>
                <p><strong>Tahmin:</strong> ${data.prediction.predicted_class}</p>
                <p><strong>Güven:</strong> %${data.prediction.confidence}</p>
                <p><em>Bu tahmin temel bilgiler kullanılarak yapılmıştır. Daha kesin sonuç için detaylı tahmini kullanın.</em></p>
            `;
            showResult(result, 'success');
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