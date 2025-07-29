# 🧠 MediPredict-AI

An AI-powered disease prediction and prescription system with voice-enabled input, multilingual support, and intelligent diagnosis powered by machine learning and natural language processing.

---

## 🚀 Features

- 🔍 **Symptom-based Disease Prediction**
- 🗣️ **Voice-enabled Symptom Input** (multilingual)
- 📝 **Automatic Prescription Generator**
- 🌐 **RESTful API Backend using Flask**
- 🤖 **ML Model trained on augmented medical dataset**
- 📦 **Git LFS managed large dataset (CSV > 100MB)**

---

## 🏗️ System Design

MediPredict-AI is a modular, voice-enabled disease prediction system integrating NLP, ML, and prescription generation via Flask REST API.

### 🔄 Architecture Overview

+--------------------------+
| End User (Patient) |
| [Voice / Text Input] |
+-----------+--------------+
|
v
+--------------------------+
| React Frontend (Planned)|
| - Symptom form (UI) |
| - Voice-to-text interface|
| - Display predictions |
| - Download prescriptions |
+-----------+--------------+
|
v
+----------------------------+
| Flask REST API Backend |
| |
| /predict -> Predict disease |
| /voice-input -> Convert voice to text |
| /prescription -> Generate prescription |
+-----------+------------------------------+
|
v
+----------------------------+
| Core Logic Modules |
| |
| 1. Voice Assistant Module |
| - SpeechRecognition |
| - gTTS (Text-to-Speech) |
| - Langdetect |
| |
| 2. Disease Prediction ML |
| - Preprocessing (One-hot)|
| - Scikit-learn Model |
| - Multi-class Classifier|
| |
| 3. Prescription Generator |
| - Template engine (Jinja)|
| - PDF/Text output |
+-----------+----------------+
|
v
+-----------------------------+
| Storage and Dataset Layer |
| |
| - Final_Augmented_dataset...|
| - Generated PDF records |
| - (Optional) MongoDB/JSON |
+-----------------------------+

yaml
Copy
Edit

---

### ⚙️ System Modules (In Detail)

#### 1. 🧠 Disease Prediction Engine

| Component       | Details |
|----------------|---------|
| **Input**      | List of symptoms (from text/voice) |
| **Model**      | Random Forest / Decision Tree / Logistic Regression |
| **Dataset**    | `Final_Augmented_dataset_Diseases_and_Symptoms.csv` (~182MB) |
| **Preprocessing** | One-hot encoding of symptoms |
| **Output**     | Predicted disease + confidence score |
| **Performance**| Evaluated using accuracy & confusion matrix |

#### 2. 🗣️ Voice Assistant Module

| Component | Details |
|----------|---------|
| **Speech Recognition** | Converts user voice to text |
| **Language Detection** | Auto-detects language (e.g., Hindi, English) |
| **Translation (future)** | Translate to English if needed |
| **Fallback** | Supports manual text input |

#### 3. 📝 Prescription Generator

| Component         | Details |
|------------------|---------|
| **Input**        | Predicted disease |
| **Mapping**      | Uses hardcoded templates or dynamic config |
| **Output**       | PDF or plain-text prescription |
| **Contents**     | Disease, medicines, dosage, advice |
| **Storage**      | Saved in `/backend/generated_prescriptions/` |

---

### 🌐 Flask REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Accepts symptom list and returns predicted disease |
| `/voice-input` | POST | Accepts voice file, returns transcribed text |
| `/prescription` | POST | Accepts diagnosis and generates PDF prescription |
| `/health` | GET | Health check endpoint |

---

### 📊 Dataset Info

| Field | Description |
|-------|-------------|
| `Symptom_1...Symptom_n` | One-hot encoded symptom flags |
| `Disease` | Target variable (multiclass) |

- Dataset: `Final_Augmented_dataset_Diseases_and_Symptoms.csv`
- Size: 182MB (tracked with Git LFS)

---

### 🧠 Tech Stack

| Layer         | Technologies                                |
|---------------|---------------------------------------------|
| Frontend (Planned) | React.js, Tailwind                     |
| Backend        | Python, Flask, REST API                    |
| AI/ML          | Scikit-learn, Pandas, NumPy                |
| Voice Input    | SpeechRecognition, gTTS, LangDetect        |
| PDF Gen        | fpdf / reportlab                           |
| Dataset        | Git LFS CSV (>100MB)                       |
| Storage        | Local file system / JSON (optional MongoDB) |

---

### 🧪 Sample API Usage

```bash
POST /predict
Body:
{
  "symptoms": ["fever", "nausea", "vomiting"]
}

Response:
{
  "predicted_disease": "Typhoid",
  "confidence": 0.91
}
