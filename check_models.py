import google.generativeai as genai
import os
from dotenv import load_dotenv

# .env dosyasındaki anahtarı yükle
load_dotenv()

try:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("HATA: GOOGLE_API_KEY bulunamadı. Lütfen .env dosyanızı kontrol edin.")
    else:
        genai.configure(api_key=api_key)

        print("API Anahtarı başarıyla yüklendi. Hesabınız için kullanılabilir modeller listeleniyor...")

        # Sadece bizim projemizin ihtiyacı olan 'generateContent' metodunu destekleyen modelleri listele
        found_model = False
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"-> Bulunan Uyumlu Model: {m.name}")
                found_model = True

        if not found_model:
            print("\nHESABINIZDA UYUMLU BİR MODEL BULUNAMADI.")
            print("Lütfen Adım 2'deki API etkinleştirme işlemini yaptığınızdan emin olun.")

        print(
            "\nLütfen yukarıdaki listeden bir model adını ('models/' kısmı OLMADAN) kopyalayıp app.py dosyanızda kullanın.")
        print("Örnek: 'gemini-1.0-pro' veya 'gemini-1.5-flash-latest'")


except Exception as e:
    print(f"\nBir Hata Oluştu: {e}")
    print("\nLütfen şunları kontrol edin:")
    print("1. API anahtarınızın .env dosyasında doğru yazıldığından emin olun.")
    print("2. Adım 2'de belirtilen 'Generative Language API'sinin etkinleştirildiğinden emin olun.")
    print("3. İnternet bağlantınızı kontrol edin.")