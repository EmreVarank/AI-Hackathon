from flask import Flask, request, jsonify, Response, stream_template, send_from_directory
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
from datetime import datetime
import os

# Llama entegrasyonu
from llama_integration import LlamaHealthBot, create_bot_instance, get_quick_health_tips

# Initialize Flask app
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)  # Enable CORS for all routes

# Initialize Llama Health Bot
health_bot = create_bot_instance()

# Load trained model and scaler
import os
model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'obesity_model.pkl')
scaler_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'scaler.pkl')

try:
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    print("Model and Scaler loaded successfully!")
    print(f"Model path: {model_path}")
    print(f"Scaler path: {scaler_path}")
except Exception as e:
    print(f"Error loading model: {e}")
    print(f"Tried to load from: {model_path}")
    print("⚠️ Model yüklenemedi, sadece chat özellikleri çalışacak!")
    model = None
    scaler = None

# Define feature columns in correct order
FEATURE_COLUMNS = ['Age', 'Gender', 'Height', 'Weight', 'CALC', 'FAVC', 'FCVC', 
                   'NCP', 'SCC', 'SMOKE', 'CH2O', 'family_history_with_overweight', 
                   'FAF', 'TUE', 'CAEC', 'MTRANS', 'BMI']

# Define class labels
OBESITY_CLASSES = {
    0: 'Normal Weight',
    1: 'Overweight Level I', 
    2: 'Overweight Level II',
    3: 'Obesity Type I',
    4: 'Insufficient Weight',
    5: 'Obesity Type II',
    6: 'Obesity Type III'
}

def process_input_data(data):
    """Process input data and convert to model format"""
    
    # Calculate BMI
    height_m = data['height'] / 100 if data['height'] > 10 else data['height']  # Handle cm/m conversion
    bmi = round(data['weight'] / (height_m ** 2), 2)
    
    # Create feature dictionary in correct order
    features = {
        'Age': data['age'],
        'Gender': 1 if data['gender'].lower() == 'male' else 0,
        'Height': height_m,
        'Weight': data['weight'],
        'CALC': {'no': 0, 'sometimes': 1, 'frequently': 2, 'always': 3}[data['calc'].lower()],
        'FAVC': 1 if data['favc'].lower() == 'yes' else 0,
        'FCVC': data['fcvc'],
        'NCP': data['ncp'],
        'SCC': 1 if data['scc'].lower() == 'yes' else 0,
        'SMOKE': 1 if data['smoke'].lower() == 'yes' else 0,
        'CH2O': data['ch2o'],
        'family_history_with_overweight': 1 if data['family_history'].lower() == 'yes' else 0,
        'FAF': data['faf'],
        'TUE': data['tue'],
        'CAEC': {'no': 0, 'sometimes': 3, 'frequently': 2, 'always': 4}[data['caec'].lower()],
        'MTRANS': {'public_transportation': 0, 'walking': 1, 'automobile': 2, 
                   'motorbike': 3, 'bike': 4}[data['mtrans'].lower()],
        'BMI': bmi
    }
    
    return features, bmi

@app.route('/', methods=['GET'])
def home():
    """Serve frontend homepage"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/chat')
def chat_page():
    """Serve chat page"""
    return send_from_directory(app.static_folder, 'chat.html')

@app.route('/api/status', methods=['GET'])
def api_status():
    """Health check endpoint"""
    return jsonify({
        "message": "Obesity Prediction API is running!",
        "status": "healthy",
        "model_loaded": model is not None
    })

@app.route('/predict', methods=['POST'])
def predict_obesity():
    """Main prediction endpoint"""
    try:
        # Check if model is loaded
        if model is None or scaler is None:
            return jsonify({
                "error": "Model not loaded properly",
                "success": False
            }), 500
        
        # Get JSON data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['gender', 'age', 'height', 'weight', 'family_history', 
                          'favc', 'fcvc', 'ncp', 'caec', 'smoke', 'ch2o', 'scc', 
                          'faf', 'tue', 'calc', 'mtrans']
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {missing_fields}",
                "success": False
            }), 400
        
        # Process input data
        features, bmi = process_input_data(data)
        
        # Convert to DataFrame
        input_df = pd.DataFrame([features])
        input_df = input_df[FEATURE_COLUMNS]  # Ensure correct column order
        
        # Scale the input
        input_scaled = scaler.transform(input_df)
        
        # Make prediction
        prediction = model.predict(input_scaled)[0]
        prediction_proba = model.predict_proba(input_scaled)[0]
        
        # Prepare response
        predicted_class = OBESITY_CLASSES[prediction]
        confidence = float(prediction_proba[prediction] * 100)
        
        # All class probabilities
        all_probabilities = {}
        for i, prob in enumerate(prediction_proba):
            all_probabilities[OBESITY_CLASSES[i]] = float(prob * 100)
        
        response = {
            "success": True,
            "prediction": {
                "bmi": bmi,
                "predicted_class": predicted_class,
                "confidence": round(confidence, 1),
                "all_probabilities": all_probabilities
            },
            "input_data": {
                "age": data['age'],
                "gender": data['gender'],
                "height": data['height'],
                "weight": data['weight'],
                "bmi": bmi
            }
        }
        
        return jsonify(response)
        
    except KeyError as e:
        return jsonify({
            "error": f"Invalid value for field: {str(e)}",
            "success": False
        }), 400
    except Exception as e:
        return jsonify({
            "error": f"Prediction failed: {str(e)}",
            "success": False
        }), 500

@app.route('/quick-predict', methods=['POST'])
def quick_predict():
    """Simple prediction with minimal inputs"""
    try:
        if model is None or scaler is None:
            return jsonify({
                "error": "Model not loaded properly",
                "success": False
            }), 500
        
        data = request.get_json()
        
        # Validate required fields for quick prediction
        required_fields = ['gender', 'age', 'height', 'weight']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {missing_fields}",
                "success": False
            }), 400
        
        # Add default values
        full_data = {
            **data,
            'family_history': 'no',
            'favc': 'no', 
            'fcvc': 2,
            'ncp': 3,
            'caec': 'sometimes',
            'smoke': 'no',
            'ch2o': 2,
            'scc': 'no',
            'faf': 1,
            'tue': 1,
            'calc': 'sometimes',
            'mtrans': 'automobile'
        }
        
        # Process and predict
        features, bmi = process_input_data(full_data)
        input_df = pd.DataFrame([features])
        input_df = input_df[FEATURE_COLUMNS]
        input_scaled = scaler.transform(input_df)
        
        prediction = model.predict(input_scaled)[0]
        prediction_proba = model.predict_proba(input_scaled)[0]
        
        predicted_class = OBESITY_CLASSES[prediction]
        confidence = float(prediction_proba[prediction] * 100)
        
        response = {
            "success": True,
            "prediction": {
                "bmi": bmi,
                "predicted_class": predicted_class,
                "confidence": round(confidence, 1)
            },
            "input_data": {
                "age": data['age'],
                "gender": data['gender'],
                "height": data['height'],
                "weight": data['weight'],
                "bmi": bmi
            },
            "note": "Quick prediction uses default values for detailed health parameters"
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            "error": f"Quick prediction failed: {str(e)}",
            "success": False
        }), 500

@app.route('/api/chat/status', methods=['GET'])
def chat_status():
    """Llama chatbot servis durumunu kontrol et"""
    try:
        ollama_status = health_bot.check_ollama_status()
        model_status = health_bot.check_model_availability() if ollama_status else False
        
        return jsonify({
            "success": True,
            "status": {
                "ollama_running": ollama_status,
                "model_available": model_status,
                "model_name": health_bot.model_name,
                "fallback_available": True  # Her zaman temel öneriler verebiliriz
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Status check failed: {str(e)}"
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_with_assistant():
    """Sağlık asistanı ile sohbet et (normal response)"""
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        if 'message' not in data:
            return jsonify({
                "success": False,
                "error": "Message field is required"
            }), 400
        
        user_message = data['message']
        context = data.get('context', None)  # Obezite tahmin sonuçları vs.
        
        # Ollama mevcut mu kontrol et
        if health_bot.check_ollama_status() and health_bot.check_model_availability():
            # Llama ile yanıt üret
            response_text = health_bot.generate_chat_response(user_message, context)
        else:
            # Fallback: Temel sağlık önerileri
            if context and 'predicted_class' in context:
                bmi = context.get('bmi', 0)
                obesity_class = context.get('predicted_class', 'Normal Weight')
                response_text = get_quick_health_tips(obesity_class, bmi)
            else:
                response_text = """
🏥 **Sağlık Asistanı**

Merhaba! Size yardımcı olmak için buradayım. 

🎯 **Yapabileceklerim:**
- Obezite ve beslenme konularında bilgi verebilirim
- Egzersiz önerileri sunabilirim  
- Sağlıklı yaşam ipuçları paylaşabilirim

⚠️ **Önemli:** Ben bir sağlık asistanıyım, tıbbi tanı koymam. Ciddi sağlık sorunları için mutlaka doktorunuza danışın.

Size nasıl yardımcı olabilirim?
"""
        
        return jsonify({
            "success": True,
            "response": response_text,
            "timestamp": datetime.now().isoformat(),
            "llama_used": health_bot.check_ollama_status()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Chat failed: {str(e)}"
        }), 500

@app.route('/api/chat/stream', methods=['POST'])
def chat_stream():
    """Streaming sohbet endpoint'i"""
    try:
        data = request.get_json()
        
        if 'message' not in data:
            return jsonify({
                "success": False,
                "error": "Message field is required"
            }), 400
        
        user_message = data['message']
        context = data.get('context', None)
        
        def generate_stream():
            """Streaming response generator"""
            try:
                if health_bot.check_ollama_status() and health_bot.check_model_availability():
                    # Llama streaming response
                    for chunk in health_bot.generate_streaming_response(user_message, context):
                        yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
                    
                    yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
                else:
                    # Fallback response
                    if context and 'predicted_class' in context:
                        bmi = context.get('bmi', 0)
                        obesity_class = context.get('predicted_class', 'Normal Weight')
                        response_text = get_quick_health_tips(obesity_class, bmi)
                    else:
                        response_text = "Üzgünüm, şu anda Llama servisi çalışmıyor. Temel sağlık önerileri için lütfen Ollama'yı başlatın."
                    
                    # Kelime kelime stream simülasyonu
                    words = response_text.split()
                    for word in words:
                        yield f"data: {json.dumps({'chunk': word + ' ', 'done': False})}\n\n"
                    
                    yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
                    
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"
        
        return Response(
            generate_stream(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        )
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Streaming chat failed: {str(e)}"
        }), 500

@app.route('/api/health-recommendations', methods=['POST'])
def get_health_recommendations():
    """Obezite tahmin sonuçlarına özel sağlık önerileri"""
    try:
        data = request.get_json()
        
        # Prediction data ve user input kontrolü
        if 'prediction' not in data or 'user_input' not in data:
            return jsonify({
                "success": False,
                "error": "Both prediction and user_input fields are required"
            }), 400
        
        prediction_data = data['prediction']
        user_input = data['user_input']
        
        # Llama ile kişiselleştirilmiş öneriler al
        if health_bot.check_ollama_status() and health_bot.check_model_availability():
            recommendations = health_bot.get_health_recommendations(prediction_data, user_input)
        else:
            # Fallback öneriler
            obesity_class = prediction_data.get('predicted_class', 'Normal Weight')
            bmi = prediction_data.get('bmi', 0)
            recommendations = get_quick_health_tips(obesity_class, bmi)
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat(),
            "personalized": health_bot.check_ollama_status()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Health recommendations failed: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("Starting Obesity Prediction API...")
    print("API Endpoints:")
    print("   GET  / - Health check")
    print("   POST /predict - Full prediction")
    print("   POST /quick-predict - Quick prediction")
    print("   POST /api/chat - Chat with health assistant")
    print("   POST /api/chat/stream - Streaming chat")
    print("   GET  /api/chat/status - Check Llama service status")
    app.run(debug=True, host='0.0.0.0', port=5000)