import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import warnings
warnings.filterwarnings('ignore')

def create_models():
    # Veri setini yükle
    print("Loading dataset...")
    df = pd.read_csv('data/ObesityDataSet_raw_and_data_sinthetic.csv')
    print(f"Dataset shape: {df.shape}")
    
    # Categorical değişkenleri encoding et
    le_dict = {}  # Her column için ayrı LabelEncoder
    
    categorical_cols = ['Gender', 'CALC', 'FAVC', 'SCC', 'SMOKE', 
                       'family_history_with_overweight', 'CAEC', 'MTRANS']
    
    df_encoded = df.copy()
    
    for col in categorical_cols:
        le = LabelEncoder()
        df_encoded[col] = le.fit_transform(df[col])
        le_dict[col] = le
    
    # Target encoding
    target_le = LabelEncoder()
    df_encoded['NObeyesdad'] = target_le.fit_transform(df['NObeyesdad'])
    
    # BMI hesapla
    df_encoded['BMI'] = df_encoded['Weight'] / (df_encoded['Height'] ** 2)
    
    # Features ve target ayır
    X = df_encoded.drop('NObeyesdad', axis=1)
    y = df_encoded['NObeyesdad']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Model eğit
    print("Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Test
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.4f}")
    
    # Model ve scaler'ı kaydet
    print("Saving models...")
    joblib.dump(model, 'models/obesity_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    
    # Target class mapping'i kaydet
    class_mapping = dict(zip(target_le.classes_, target_le.transform(target_le.classes_)))
    reverse_mapping = {v: k for k, v in class_mapping.items()}
    
    print("\nClass mapping:")
    for k, v in reverse_mapping.items():
        print(f"{k}: {v}")
    
    print("\nModels saved successfully!")
    return model, scaler, reverse_mapping

if __name__ == "__main__":
    create_models()