"""
Llama (Ollama) entegrasyonu için helper fonksiyonları
Turkish Health Assistant Chatbot için özelleştirilmiş prompt sistemi
"""

import requests
import json
import logging
from typing import Optional, Dict, Any, Generator
from datetime import datetime

# Logging yapılandırması
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LlamaHealthBot:
    """Llama tabanlı sağlık danışmanı chatbot sınıfı"""
    
    def __init__(self, ollama_url: str = "http://localhost:11434", model_name: str = "llama3.1"):
        self.ollama_url = ollama_url
        self.model_name = model_name
        self.api_endpoint = f"{ollama_url}/api/generate"
        self.chat_endpoint = f"{ollama_url}/api/chat"
        
        # Türkçe sağlık danışmanı system prompt'u
        self.system_prompt = """Sen uzman bir sağlık danışmanısın ve Türkçe konuşuyorsun. 
Görevin kullanıcılara obezite ve genel sağlık konularında yardımcı olmak.

ÖNEMLİ KURALLAR:
1. Kesinlikle tıbbi tanı koymuyorsun, sadece genel sağlık önerileri veriyorsun
2. Her zaman "Bir doktora danışmanızı öneririm" ifadesini kullan
3. Kişiselleştirilmiş öneriler ver ama medikal kesinlik iddia etme
4. Samimi, destekleyici ve motive edici bir dil kullan
5. Bilimsel kaynaklara dayalı bilgiler ver
6. Türkçe konuş ve Türk kültürüne uygun öneriler ver

Kullanıcının obezite seviyesi ve sağlık verileri verildiğinde:
- BMI değerini açıkla
- Beslenme önerileri ver (Türk mutfağından örnekler dahil)
- Egzersiz önerileri ver
- Yaşam tarzı değişiklikleri öner
- Motivasyon sağla
- Risk faktörlerini açıkla

Cevaplarını yapılandır:
🎯 **Durum Değerlendirmesi**
🥗 **Beslenme Önerileri** 
🏃 **Fiziksel Aktivite**
💡 **Yaşam Tarzı Değişiklikleri**
⚠️ **Önemli Notlar**

Her zaman pozitif ve destekleyici ol!"""

    def check_ollama_status(self) -> bool:
        """Ollama servisinin çalışıp çalışmadığını kontrol et"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            return response.status_code == 200
        except requests.RequestException as e:
            logger.error(f"Ollama bağlantı hatası: {e}")
            return False

    def check_model_availability(self) -> bool:
        """Belirtilen modelin mevcut olup olmadığını kontrol et"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                available_models = [model['name'].split(':')[0] for model in models]
                return self.model_name in available_models
            return False
        except requests.RequestException as e:
            logger.error(f"Model kontrol hatası: {e}")
            return False

    def format_health_context(self, prediction_data: Dict[str, Any], user_input: Dict[str, Any]) -> str:
        """Kullanıcının sağlık verilerini Llama için formatla"""
        
        # Obezite sınıflarını Türkçe açıklamalarla eşleştir
        obesity_descriptions = {
            'Normal Weight': 'Normal kilo - Sağlıklı BMI aralığında',
            'Overweight Level I': 'Hafif kilolu - BMI idealin üzerinde',
            'Overweight Level II': 'Orta derecede kilolu - Dikkat gerektiren durum', 
            'Obesity Type I': 'Tip 1 Obezite - Sağlık riskleri mevcut',
            'Obesity Type II': 'Tip 2 Obezite - Ciddi sağlık riskleri',
            'Obesity Type III': 'Tip 3 Obezite (Morbid) - Acil müdahale gerekli',
            'Insufficient Weight': 'Yetersiz kilo - Beslenme desteği gerekli'
        }
        
        predicted_class = prediction_data.get('predicted_class', 'Bilinmeyen')
        description = obesity_descriptions.get(predicted_class, predicted_class)
        
        context = f"""
KULLANICI SAĞLIK PROFİLİ:
👤 Kişisel Bilgiler:
- Yaş: {user_input.get('age', 'Belirtilmemiş')} 
- Cinsiyet: {user_input.get('gender', 'Belirtilmemiş')}
- Boy: {user_input.get('height', 'Belirtilmemiş')} cm
- Kilo: {user_input.get('weight', 'Belirtilmemiş')} kg

🎯 ML Tahmin Sonucu:
- BMI: {prediction_data.get('bmi', 'Hesaplanamadı')}
- Obezite Seviyesi: {description}
- Tahmin Güveni: %{prediction_data.get('confidence', 0)}

📊 Yaşam Tarzı Bilgileri:
- Aile Obezite Geçmişi: {user_input.get('family_history', 'Belirtilmemiş')}
- Yüksek Kalorili Besin Tüketimi: {user_input.get('favc', 'Belirtilmemiş')}
- Sebze Tüketim Sıklığı: {user_input.get('fcvc', 'Belirtilmemiş')}
- Günlük Öğün Sayısı: {user_input.get('ncp', 'Belirtilmemiş')}
- Sigara Kullanımı: {user_input.get('smoke', 'Belirtilmemiş')}
- Günlük Su Tüketimi: {user_input.get('ch2o', 'Belirtilmemiş')} litre
- Fiziksel Aktivite Sıklığı: {user_input.get('faf', 'Belirtilmemiş')} gün/hafta
- Teknoloji Kullanım Süresi: {user_input.get('tue', 'Belirtilmemiş')} saat/gün
- Ulaşım Şekli: {user_input.get('mtrans', 'Belirtilmemiş')}

Bu bilgilere dayanarak kişiselleştirilmiş sağlık önerileri ver.
"""
        return context

    def generate_chat_response(self, user_message: str, context: Optional[str] = None) -> str:
        """Basit chat response üret (streaming olmayan)"""
        try:
            # Prompt'u hazırla
            full_prompt = self.system_prompt
            if context:
                full_prompt += f"\n\n{context}"
            full_prompt += f"\n\nKullanıcı Mesajı: {user_message}"
            
            payload = {
                "model": self.model_name,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 1000
                }
            }
            
            response = requests.post(
                self.api_endpoint,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', 'Üzgünüm, bir yanıt üretemedi.')
            else:
                logger.error(f"API hatası: {response.status_code} - {response.text}")
                return "Şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin."
                
        except requests.RequestException as e:
            logger.error(f"İstek hatası: {e}")
            return "Bağlantı sorunu yaşıyorum. Ollama servisinin çalıştığından emin olun."
        except Exception as e:
            logger.error(f"Beklenmeyen hata: {e}")
            return "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."

    def generate_streaming_response(self, user_message: str, context: Optional[str] = None) -> Generator[str, None, None]:
        """Streaming chat response üret"""
        try:
            # Prompt'u hazırla
            full_prompt = self.system_prompt
            if context:
                full_prompt += f"\n\n{context}"
            full_prompt += f"\n\nKullanıcı Mesajı: {user_message}"
            
            payload = {
                "model": self.model_name,
                "prompt": full_prompt,
                "stream": True,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 1000
                }
            }
            
            response = requests.post(
                self.api_endpoint,
                json=payload,
                stream=True,
                timeout=60
            )
            
            if response.status_code == 200:
                for line in response.iter_lines():
                    if line:
                        try:
                            json_response = json.loads(line.decode('utf-8'))
                            if 'response' in json_response:
                                yield json_response['response']
                                
                            # Stream tamamlandı kontrolü
                            if json_response.get('done', False):
                                break
                                
                        except json.JSONDecodeError:
                            continue
            else:
                yield "Teknik bir sorun yaşıyorum. Lütfen daha sonra tekrar deneyin."
                
        except requests.RequestException as e:
            logger.error(f"Streaming hatası: {e}")
            yield "Bağlantı sorunu yaşıyorum. Ollama servisinin çalıştığından emin olun."
        except Exception as e:
            logger.error(f"Beklenmeyen streaming hatası: {e}")
            yield "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."

    def get_health_recommendations(self, prediction_data: Dict[str, Any], user_input: Dict[str, Any]) -> str:
        """Obezite tahmin sonuçlarına özel sağlık önerileri üret"""
        context = self.format_health_context(prediction_data, user_input)
        
        message = """Yukarıdaki sağlık profilime göre:
1. Durumumu nasıl değerlendiriyorsun?
2. Beslenme konusunda hangi önerilerin var?
3. Hangi egzersizleri yapmalıyım?
4. Yaşam tarzımda hangi değişiklikleri yapmalıyım?
5. Motivasyonel tavsiyeler ver.

Lütfen detaylı ve kişiselleştirilmiş öneriler ver."""

        return self.generate_chat_response(message, context)

# Yardımcı fonksiyonlar
def create_bot_instance() -> LlamaHealthBot:
    """Yeni bot instance'ı oluştur"""
    return LlamaHealthBot()

def get_quick_health_tips(obesity_class: str, bmi: float) -> str:
    """Hızlı sağlık ipuçları (Ollama olmadan da çalışacak fallback)"""
    tips = {
        'Normal Weight': f"""
🎉 **Tebrikler! Sağlıklı kilonuz var (BMI: {bmi})**

🥗 **Sağlıklı kiloyu korumak için:**
- Dengeli beslenme alışkanlıklarınızı sürdürün
- Günde 5 porsiyon meyve-sebze tüketin
- Bol su için (günde 2-3 litre)

🏃 **Fiziksel aktivite:**
- Haftada 150 dakika orta tempolu egzersiz
- Günlük 30 dakika yürüyüş idealdir

💡 **Genel öneriler:**
- Düzenli sağlık kontrolü yaptırın
- Stres yönetimi önemli
- Kaliteli uyku alın (7-9 saat)
""",
        'Overweight Level I': f"""
⚠️ **Hafif kilolu durumdasınız (BMI: {bmi})**

🥗 **Beslenme önerileri:**
- Porsiyon kontrolü yapın
- Şekerli içecekleri azaltın
- Tam tahıllı ürünleri tercih edin
- Protein ağırlıklı beslenin

🏃 **Egzersiz programı:**
- Haftada 4-5 gün 45 dakika tempolu yürüyüş
- Kuvvet antrenmanları ekleyin
- Merdiven çıkmayı tercih edin

💡 **Yaşam tarzı:**
- Küçük değişikliklerle başlayın
- Ayda 1-2 kg vermek hedefleyin
- Sosyal destek alın
""",
        'Obesity Type I': f"""
🚨 **Tip 1 obezite durumundasınız (BMI: {bmi})**

🥗 **Beslenme stratejisi:**
- Diyetisyene danışın
- Kalori kısıtlaması gerekli
- İşlenmiş gıdalardan kaçının
- Sık sık az yiyin (6 öğün)

🏃 **Egzersiz programı:**
- Doktor onayı alın
- Düşük etkili egzersizlerle başlayın (yüzme, yürüyüş)
- Kademeli artırın

⚠️ **Önemli:**
- Mutlaka hekim kontrolünde hareket edin
- Kan şekeri ve tansiyon takibi yapın
- Profesyonel destek alın
"""
    }
    
    return tips.get(obesity_class, f"BMI: {bmi} - Detaylı değerlendirme için doktora danışın.")