# 🏥 Obesity Prediction Web Application

Professional machine learning web application for obesity level prediction using Random Forest algorithm.

## 📁 Project Structure

```
superlig/
├── 📁 frontend/                 # Frontend web application
│   ├── 📁 css/
│   │   └── styles.css          # Application styles
│   ├── 📁 js/
│   │   └── app.js              # JavaScript functionality
│   └── index.html              # Main web interface
├── 📁 backend/                 # Backend API server
│   └── app.py                  # Flask REST API
├── 📁 models/                  # Trained ML models
│   ├── obesity_model.pkl       # Random Forest model
│   └── scaler.pkl             # Feature scaler
├── 📁 data/                    # Data and notebooks
│   ├── main.ipynb             # ML development notebook
│   └── ObesityDataSet_raw_and_data_sinthetic.csv
├── 📁 docs/                    # Documentation
│   └── README.md              # This file
├── requirements.txt           # Python dependencies
├── start.bat                 # Windows launcher script
└── test.json                 # API test file
```

## 🚀 Kurulum ve Çalıştırma

### 1. Gerekli kütüphaneleri yükle
```bash
pip install -r requirements.txt
```

### 2. Model dosyalarını oluştur
Jupyter Notebook'ta son cell'i çalıştırarak model dosyalarını oluştur:
```python
# Notebook'ta bu kodu çalıştır
joblib.dump(best_model, 'obesity_model.pkl')
joblib.dump(scaler, 'scaler.pkl')
```

### 3. Flask API'yi başlat
```bash
python app.py
```

API şu adreste çalışacak: http://localhost:5000

### 4. Web sayfasını aç
`index.html` dosyasını tarayıcıda aç veya bir web sunucusu ile serve et.

## 🔗 API Endpoints

### GET /
Sistem durumu kontrolü

### POST /predict
Detaylı tahmin (tüm parametreler)

**Request Body:**
```json
{
    "gender": "Male",
    "age": 25,
    "height": 175,
    "weight": 80,
    "family_history": "no",
    "favc": "yes",
    "fcvc": 2,
    "ncp": 3,
    "caec": "Sometimes",
    "smoke": "no",
    "ch2o": 2,
    "scc": "no",
    "faf": 1,
    "tue": 1,
    "calc": "Sometimes",
    "mtrans": "Automobile"
}
```

### POST /quick-predict
Hızlı tahmin (sadece temel bilgiler)

**Request Body:**
```json
{
    "gender": "Female",
    "age": 30,
    "height": 165,
    "weight": 60
}
```

**Response:**
```json
{
    "success": true,
    "prediction": {
        "bmi": 22.04,
        "predicted_class": "Normal Weight",
        "confidence": 93.0,
        "all_probabilities": {
            "Normal Weight": 93.0,
            "Overweight Level I": 4.0,
            "Insufficient Weight": 3.0,
            ...
        }
    },
    "input_data": {
        "age": 30,
        "gender": "Female",
        "height": 165,
        "weight": 60,
        "bmi": 22.04
    }
}
```

## 🎯 Obezite Seviyeleri

- **Insufficient Weight**: Yetersiz Kilo
- **Normal Weight**: Normal Kilo
- **Overweight Level I**: Hafif Kilolu
- **Overweight Level II**: Orta Kilolu
- **Obesity Type I**: Tip 1 Obezite
- **Obesity Type II**: Tip 2 Obezite
- **Obesity Type III**: Tip 3 Obezite

## 📊 Model Performansı

- **Algoritma**: Random Forest
- **Accuracy**: ~96%
- **Features**: 17 özellik (BMI dahil)
- **Classes**: 7 obezite seviyesi

## 🛠 Teknik Detaylar

- **Backend**: Flask (Python)
- **Frontend**: HTML/CSS/JavaScript
- **ML**: scikit-learn (Random Forest)
- **Data Processing**: pandas, numpy
- **Scaling**: StandardScaler

## 📝 Kullanım Örnekleri

### Python'da direkt kullanım:
```python
import requests

data = {
    "gender": "Male",
    "age": 25,
    "height": 175,
    "weight": 80,
    # ... diğer parametreler
}

response = requests.post('http://localhost:5000/predict', json=data)
result = response.json()
print(result['prediction']['predicted_class'])
```

### JavaScript'te kullanım:
```javascript
fetch('http://localhost:5000/quick-predict', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        gender: 'Female',
        age: 30,
        height: 165,
        weight: 60
    })
})
.then(response => response.json())
.then(data => console.log(data.prediction));
```

## ⚠️ Önemli Notlar

1. Model sadece tahmin amaçlıdır, tıbbi teşhis yerine geçmez
2. API CORS enabled - tüm domainlerden erişim mevcut
3. Height değeri cm olarak girilmeli (örn: 175)
4. Kategorik değerler küçük harf olmalı (örn: "male", "yes", "sometimes")

## 🔧 Geliştirme

Modeli geliştirmek için:
1. `main.ipynb`'te yeni özellikler ekleyin
2. Modeli yeniden eğitin
3. `app.py`'deki feature sıralamasını güncelleyin
4. Yeni model dosyalarını kaydedin

## 🏃‍♂️ Hızlı Test

```bash
# API'yi test et
curl -X POST http://localhost:5000/quick-predict \
  -H "Content-Type: application/json" \
  -d '{"gender":"Male","age":25,"height":175,"weight":80}'
```