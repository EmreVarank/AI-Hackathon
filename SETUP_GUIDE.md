# 🚀 Obezite Tahmin Sistemi + Llama AI Chatbot Kurulum Rehberi

Bu rehber, obezite tahmin sisteminize Llama AI tabanlı sağlık chatbot'u entegre etmek için adım adım kurulum talimatlarını içerir.

## 📋 Gereksinimler

### Sistem Gereksinimleri
- **İşletim Sistemi:** Windows 10/11, macOS, Linux
- **Python:** 3.8 veya üzeri
- **RAM:** En az 8GB (Llama için 16GB önerilen)
- **Disk Alanı:** En az 10GB boş alan

### Yazılım Gereksinimleri
- Python 3.8+
- pip (Python paket yöneticisi)
- Git (isteğe bağlı)

## 🔧 Kurulum Adımları

### 1. Python Bağımlılıklarını Kurun

```bash
# Proje dizinine gidin
cd "c:\Users\Emre\Desktop\Obesity"

# Sanal ortam oluşturun (önerilen)
python -m venv obesity_env

# Sanal ortamı aktif edin
# Windows:
obesity_env\Scripts\activate
# macOS/Linux:
source obesity_env/bin/activate

# Bağımlılıkları kurun
pip install -r requirements.txt
```

### 2. Ollama Kurulumu ve Yapılandırması

#### Windows İçin:

```bash
# 1. Ollama'yı indirin ve kurun
# https://ollama.ai/download adresinden Windows installer'ı indirin

# 2. Komut satırından Ollama'yı test edin
ollama --version

# 3. Llama3.1 modelini kurun (yaklaşık 4.7GB)
ollama pull llama3.1

# 4. Model kurulumunu doğrulayın
ollama list
```

#### macOS İçin:

```bash
# 1. Homebrew ile kurun
brew install ollama

# veya
# https://ollama.ai/download adresinden macOS installer'ı indirin

# 2. Llama3.1 modelini kurun
ollama pull llama3.1

# 3. Servisi başlatın
brew services start ollama
```

#### Linux İçin:

```bash
# 1. Ollama'yı kurun
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Llama3.1 modelini kurun
ollama pull llama3.1

# 3. Servis olarak başlatın
sudo systemctl enable ollama
sudo systemctl start ollama
```

### 3. Ollama Servisini Başlatın

```bash
# Ollama servisini arka planda başlatın
ollama serve

# Alternatif olarak (Windows'ta):
# Başlat menüsünden "Ollama" uygulamasını çalıştırın
```

### 4. Flask Backend'i Başlatın

```bash
# Backend dizinine gidin
cd backend

# Flask uygulamasını başlatın
python app.py

# veya
flask run --host=0.0.0.0 --port=5000
```

### 5. Frontend'i Çalıştırın

```bash
# Proje ana dizininde
# Basit HTTP sunucusu başlatın (Python ile)
cd frontend
python -m http.server 8080

# veya Node.js varsa
npx http-server -p 8080

# Tarayıcıda açın: http://localhost:8080
```

## 🧪 Test ve Doğrulama

### 1. Backend API Testi

```bash
# API sağlık kontrolü
curl http://localhost:5000/

# Chat servisi durumu
curl http://localhost:5000/api/chat/status
```

### 2. Ollama Testi

```bash
# Doğrudan Ollama testi
curl http://localhost:11434/api/generate \
  -d '{"model": "llama3.1", "prompt": "Merhaba, nasılsın?", "stream": false}'
```

### 3. Fonksiyonel Test

1. **Obezite Tahmini:**
   - `http://localhost:8080` adresine gidin
   - Form doldurun ve tahmin yapın
   - Sonuçların görüntülendiğini doğrulayın

2. **Chat Entegrasyonu:**
   - Tahmin sonrası "Sağlık Asistanı ile Konuş" butonuna tıklayın
   - Chat sayfasının açıldığını kontrol edin
   - Mesaj gönderip yanıt aldığınızı doğrulayın

## 🚨 Yaygın Sorunlar ve Çözümler

### Sorun 1: Ollama Bağlantı Hatası

**Belirtiler:**
- "Ollama bağlantı hatası" mesajı
- Chat'te sadece fallback mesajlar

**Çözüm:**
```bash
# Ollama servisini yeniden başlatın
ollama serve

# Port kontrolü yapın
netstat -an | grep 11434

# Windows'ta:
netstat -an | findstr 11434
```

### Sorun 2: Model Bulunamadı Hatası

**Belirtiler:**
- "Model mevcut değil" uyarısı
- Llama yanıtları alınamıyor

**Çözüm:**
```bash
# Mevcut modelleri listeleyin
ollama list

# Llama3.1 yoksa tekrar kurun
ollama pull llama3.1

# Model boyutu kontrolü (yaklaşık 4.7GB olmalı)
```

### Sorun 3: CORS Hatası

**Belirtiler:**
- Browser console'da CORS hatası
- Frontend-Backend iletişim sorunu

**Çözüm:**
```python
# backend/app.py dosyasında CORS ayarlarını kontrol edin
from flask_cors import CORS
CORS(app, origins=["http://localhost:8080", "http://127.0.0.1:8080"])
```

### Sorun 4: Port Çakışması

**Belirtiler:**
- "Port kullanımda" hatası
- Servislerin başlamaması

**Çözüm:**
```bash
# Kullanılan portları kontrol edin
# Windows:
netstat -ano | findstr :5000
netstat -ano | findstr :8080

# Linux/macOS:
lsof -i :5000
lsof -i :8080

# Alternatif portlar kullanın
python app.py --port=5001
python -m http.server 8081
```

## 📊 Performans Optimizasyonu

### Llama Model Optimizasyonu

```bash
# Daha küçük model kullanın (daha hızlı)
ollama pull llama3.1:8b

# Model parametrelerini ayarlayın
# llama_integration.py dosyasında:
"options": {
    "temperature": 0.7,    # Yaratıcılık (0.1-1.0)
    "top_p": 0.9,         # Çeşitlilik (0.1-1.0)
    "max_tokens": 1000    # Maksimum kelime sayısı
}
```

### Cache Ayarları

```python
# backend/app.py'ye cache ekleyin
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@cache.memoize(timeout=300)  # 5 dakika cache
def get_health_recommendations(prediction_data, user_input):
    # Mevcut kod...
```

## 🔒 Güvenlik Önerileri

### 1. API Güvenliği

```python
# Rate limiting ekleyin
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/chat', methods=['POST'])
@limiter.limit("10 per minute")
def chat_with_assistant():
    # Mevcut kod...
```

### 2. Input Validation

```python
# Kullanıcı girişlerini doğrulayın
def validate_input(data):
    if not isinstance(data.get('message'), str):
        raise ValueError("Geçersiz mesaj formatı")
    
    if len(data['message']) > 1000:
        raise ValueError("Mesaj çok uzun")
    
    return True
```

## 📱 Mobil Uyumluluk

CSS responsive tasarım zaten dahil, ancak ek optimizasyonlar:

```css
/* chat.css'e eklenebilir */
@media (max-width: 480px) {
    .chat-sidebar {
        position: fixed;
        left: -300px;
        transition: left 0.3s;
        z-index: 1000;
    }
    
    .chat-sidebar.open {
        left: 0;
    }
}
```

## 🔄 Otomatik Başlatma

### Windows Servis Olarak Çalıştırma

```batch
@echo off
cd /d "c:\Users\Emre\Desktop\Obesity"
call obesity_env\Scripts\activate
cd backend
python app.py
```

### Linux Systemd Servisi

```ini
[Unit]
Description=Obesity Prediction API
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/obesity/backend
Environment=PATH=/path/to/obesity/obesity_env/bin
ExecStart=/path/to/obesity/obesity_env/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## 📈 Monitoring ve Logging

```python
# backend/app.py'ye logging ekleyin
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('obesity_api.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

## 🎯 Sonuç

Bu kurulum rehberini takip ederek:

✅ **Başarıyla kurulmuş olacak:**
- Flask backend API'si
- Llama AI entegrasyonu
- Modern chat arayüzü
- Obezite tahmin sistemi entegrasyonu

✅ **Özellikler:**
- Gerçek zamanlı AI sohbeti
- Kişiselleştirilmiş sağlık önerileri
- Streaming chat deneyimi
- Responsive mobil tasarım
- Fallback sistemi (Llama çalışmasa bile temel öneriler)

## 🆘 Destek

Sorun yaşadığınızda:

1. **Log dosyalarını kontrol edin**
2. **Port çakışması olup olmadığına bakın**
3. **Ollama servisinin çalıştığından emin olun**
4. **Browser console'da hata mesajlarını inceleyin**

**İletişim:** GitHub Issues üzerinden sorularınızı sorabilirsiniz.

---

**⚠️ Önemli Uyarı:** Bu sistem eğitim ve demo amaçlıdır. Gerçek tıbbi tanı koymaz, sadece genel sağlık önerileri sunar. Ciddi sağlık sorunları için mutlaka doktorunuza başvurun.