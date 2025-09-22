# 🏥 AI-Powered Obesity Prediction & Health Consultation System

Advanced machine learning obesity prediction system integrated with Llama AI health chatbot for personalized health consultations and recommendations.

## ✨ Key Features

### 🤖 AI Health Chatbot
- **Llama 3.1 Integration**: Advanced AI health assistant with Turkish language support
- **Personalized Recommendations**: Custom health advice based on your prediction results
- **Streaming Chat**: Real-time conversation with intelligent responses
- **Health Context Awareness**: AI understands your BMI, obesity level, and health profile

### 📊 ML Prediction System
- **⚡ Quick Prediction**: Basic info (age, gender, height, weight)
- **🎯 Detailed Prediction**: Full lifestyle analysis (17 features)
- **🔬 High Accuracy**: ~96% accuracy Random Forest model
- **📱 Responsive Design**: Works on all devices

### 🔒 Privacy & Security
- **Local AI Processing**: Llama runs locally via Ollama (no external API calls)
- **No Data Storage**: Personal data never stored or transmitted
- **Turkish Language**: Full Turkish language support for local users

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- 8GB RAM (16GB recommended for AI features)
- 10GB free disk space

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EmreVarank/AI-Hackathon.git
   cd AI-Hackathon
   ```

2. **Set up Python environment:**
   ```bash
   python -m venv obesity_env
   
   # Windows
   obesity_env\Scripts\activate
   
   # macOS/Linux  
   source obesity_env/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Install Ollama and Llama model:**
   ```bash
   # Download Ollama from https://ollama.ai/download
   # Then install Llama 3.1 model
   ollama pull llama3.1
   ```

4. **Run the application:**
   ```bash
   # Start backend server
   cd backend
   python app.py
   
   # In another terminal, serve frontend
   cd frontend
   python -m http.server 8080
   ```

5. **Open the application:**
   - Visit: http://localhost:8080
   - Backend API: http://localhost:5000

## 🏗️ Architecture

```
📁 frontend/           # React-style web interface
│   ├── index.html     # Main prediction page
│   ├── chat.html      # AI chatbot interface
│   ├── css/           # Modern styling
│   └── js/            # Interactive functionality
│
📁 backend/            # Flask API server
│   ├── app.py         # Main Flask application
│   └── llama_integration.py  # Llama AI integration
│
📁 models/             # Trained ML models
│   ├── obesity_model.pkl     # Random Forest classifier
│   └── scaler.pkl           # Feature scaler
│
📁 data/              # Dataset and analysis
│   └── ObesityDataSet_raw_and_data_sinthetic.csv
```

## 🎯 Obesity Classifications

- **Insufficient Weight** (Yetersiz Kilo)
- **Normal Weight** (Normal Kilo)  
- **Overweight Level I** (Hafif Kilolu)
- **Overweight Level II** (Orta Kilolu)
- **Obesity Type I** (Tip 1 Obezite)
- **Obesity Type II** (Tip 2 Obezite) 
- **Obesity Type III** (Tip 3 Obezite)

## 🔗 API Endpoints

### ML Prediction
- `POST /predict` - Detailed prediction (17 features)
- `POST /quick-predict` - Quick prediction (4 basic features)

### AI Chatbot
- `POST /api/chat` - Send message to AI health assistant
- `GET /api/chat/stream` - Stream AI responses in real-time
- `GET /api/chat/status` - Check AI system status
- `POST /api/health-recommendations` - Get personalized health advice

## 🛠️ Technology Stack

- **Backend**: Flask, scikit-learn, Ollama API
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI Model**: Llama 3.1 (4.7GB) via Ollama
- **ML Model**: Random Forest (~96% accuracy)
- **Language Support**: Turkish & English

## 📖 Documentation

- **Setup Guide**: See `SETUP_GUIDE.md` for detailed installation instructions
- **API Documentation**: See `docs/README.md` for complete API reference
- **Development**: Technical implementation details in docs folder

## 🎮 How to Use

1. **Make a Prediction**: Enter your health data on the main page
2. **Get Results**: View your obesity level classification and BMI
3. **Chat with AI**: Click "Sağlık Danışmanı ile Konuş" to get personalized advice
4. **Health Consultation**: Ask questions about diet, exercise, and health improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Medical Disclaimer

This system is for educational and informational purposes only. It does not provide medical advice and should not be used as a substitute for professional medical consultation, diagnosis, or treatment.

---

**🎯 Ready to start?** Make your first prediction and experience AI-powered health consultation!