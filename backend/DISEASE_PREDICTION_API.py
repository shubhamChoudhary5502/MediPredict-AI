from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pickle
import os
from flask_cors import CORS
from voice_assistant.assistant_routes import assistant_bp



app = Flask(__name__)


CORS(app)  # Enable CORS for all routes
app.register_blueprint(assistant_bp)

# Global variables to store model and feature names
model = None
feature_names = None
trained = False

def load_and_train_model():
    """Load data and train the model"""
    global model, feature_names, trained
    
    try:
        # Load the dataset
        df = pd.read_csv("Final_Augmented_dataset_Diseases_and_Symptoms.csv")
        df.rename(columns=lambda x: x.strip(), inplace=True)
        
        # Define features and target
        X = df.drop(columns=["diseases"])
        y = df["diseases"]
        
        # Filter diseases with minimum samples
        min_samples = 5
        class_counts = y.value_counts()
        diseases_to_keep = class_counts[class_counts >= min_samples].index
        
        mask = y.isin(diseases_to_keep)
        X_filtered = X[mask]
        y_filtered = y[mask]
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X_filtered, y_filtered, test_size=0.2, random_state=42, stratify=y_filtered
        )
        
        # Train the model
        model = RandomForestClassifier(random_state=42, n_estimators=100)
        model.fit(X_train, y_train)
        
        # Store feature names
        feature_names = X_train.columns.tolist()
        trained = True
        
        print("✓ Model trained successfully!")
        print(f"✓ Number of features: {len(feature_names)}")
        print(f"✓ Number of diseases: {len(model.classes_)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error training model: {e}")
        return False

def predict_disease_from_symptoms(symptom_input, top_k=5):
    """
    Predict diseases based on symptom input
    
    Args:
        symptom_input: List of symptoms or string of symptoms separated by commas
        top_k: Number of top predictions to return
    
    Returns:
        Dictionary with predictions and matched symptoms
    """
    global model, feature_names
    
    if not trained:
        raise Exception("Model not trained. Please train the model first.")
    
    # Create empty feature vector
    feature_vector = np.zeros(len(feature_names))
    
    # Process input symptoms
    if isinstance(symptom_input, str):
        input_symptoms = [symptom.strip().lower() for symptom in symptom_input.split(',')]
    else:
        input_symptoms = [symptom.strip().lower() for symptom in symptom_input]
    
    matched_symptoms = []
    unmatched_symptoms = []
    
    # Match input symptoms to feature names
    for symptom in input_symptoms:
        matched = False
        for i, feature in enumerate(feature_names):
            if symptom in feature.lower() or feature.lower() in symptom:
                feature_vector[i] = 1  # Binary: symptom present
                matched_symptoms.append(feature)
                matched = True
                break
        
        if not matched:
            unmatched_symptoms.append(symptom)
    
    # Get predictions
    probabilities = model.predict_proba([feature_vector])[0]
    top_indices = np.argsort(probabilities)[::-1][:top_k]
    
    predictions = []
    for i in top_indices:
        disease = model.classes_[i]
        probability = float(probabilities[i])
        confidence = "High" if probability > 0.7 else "Medium" if probability > 0.3 else "Low"
        
        predictions.append({
            "disease": disease,
            "probability": probability,
            "confidence": confidence
        })
    
    return {
        'matched_symptoms': matched_symptoms,
        'unmatched_symptoms': unmatched_symptoms,
        'predictions': predictions,
        'total_symptoms_checked': len(input_symptoms),
        'matched_count': len(matched_symptoms),
        'unmatched_count': len(unmatched_symptoms)
    }

# API Routes
@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Disease Prediction API is running",
        "model_trained": trained,
        "available_endpoints": [
            "GET /health - Health check",
            "POST /predict - Predict diseases from symptoms",
            "GET /symptoms - Get list of available symptoms",
            "POST /train - Train/retrain the model"
        ]
    })

@app.route('/health', methods=['GET'])
def health():
    """Detailed health check"""
    return jsonify({
        "status": "healthy",
        "model_trained": trained,
        "features_count": len(feature_names) if feature_names else 0,
        "diseases_count": len(model.classes_) if model else 0
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict diseases from symptoms"""
    try:
        if not trained:
            return jsonify({
                "error": "Model not trained. Please train the model first.",
                "success": False
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                "error": "No JSON data provided",
                "success": False
            }), 400
        
        symptoms = data.get('symptoms', [])
        top_k = data.get('top_k', 5)
        
        if not symptoms:
            return jsonify({
                "error": "No symptoms provided",
                "success": False
            }), 400
        
        # Validate top_k
        if not isinstance(top_k, int) or top_k < 1 or top_k > 20:
            top_k = 5
        
        # Get predictions
        result = predict_disease_from_symptoms(symptoms, top_k)
        
        # Add success flag
        result['success'] = True
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/symptoms', methods=['GET'])
def get_symptoms():
    """Get list of available symptoms"""
    try:
        if not trained:
            return jsonify({
                "error": "Model not trained. Please train the model first.",
                "success": False
            }), 400
        
        return jsonify({
            "symptoms": feature_names,
            "total_symptoms": len(feature_names),
            "success": True
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Train or retrain the model"""
    try:
        success = load_and_train_model()
        
        if success:
            return jsonify({
                "message": "Model trained successfully",
                "features_count": len(feature_names),
                "diseases_count": len(model.classes_),
                "success": True
            })
        else:
            return jsonify({
                "error": "Failed to train model",
                "success": False
            }), 500
            
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/predict_example', methods=['GET'])
def predict_example():
    """Example prediction endpoint with sample data"""
    try:
        if not trained:
            return jsonify({
                "error": "Model not trained. Please train the model first.",
                "success": False
            }), 400
        
        # Example symptoms
        example_symptoms = ["fever", "cough", "headache"]
        result = predict_disease_from_symptoms(example_symptoms)
        result['success'] = True
        result['note'] = "This is an example prediction with sample symptoms"
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

if __name__ == '__main__':
    print("🏥 Disease Prediction API")
    print("=" * 50)
    print("Starting server...")
    
    # Try to load and train model on startup
    print("Training model...")
    if load_and_train_model():
        print("✓ Model ready!")
    else:
        print("⚠️  Model training failed. You can train it via /train endpoint")
    
    print("=" * 50)
    print("API Endpoints:")
    print("GET  /           - Health check")
    print("GET  /health     - Detailed health check")
    print("POST /predict    - Predict diseases from symptoms")
    print("GET  /symptoms   - Get available symptoms")
    print("POST /train      - Train/retrain model")
    print("GET  /predict_example - Example prediction")
    print("=" * 50)
    
    app.run(debug=False, host='0.0.0.0', port=5000)