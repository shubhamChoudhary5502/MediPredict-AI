from flask import Flask, request, jsonify, send_file, render_template_string
import os
import subprocess
from datetime import datetime
import json
from flask_cors import CORS
import requests
from typing import Dict, List
from voice_assistant.assistant_routes import assistant_bp
from voice_assistant import assistant_routes
from utils.prescription_generator import MedicalPrescriptionGenerator

app = Flask(__name__)
app.register_blueprint(assistant_routes.assistant_bp)
CORS(app) 

# Hardcoded Gemini API key
GEMINI_API_KEY = "AIzaSyAgi2UmNFRvtDsXRwbOiDZQGwAY6b_GE7Y"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

class MedicalPrescriptionGenerator:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.api_url = GEMINI_API_URL
    
    def generate_prescription_data(self, disease_name: str) -> Dict:
        """Generate prescription data using Gemini API"""
        prompt = f"""
        Generate a medical prescription for the disease: {disease_name}
        
        Please provide a JSON response with the following structure:
        {{
            "disease_name": "Full medical name of the disease",
            "general_instructions": [
                "List of 4-6 general care instructions",
                "Include lifestyle modifications",
                "Include monitoring recommendations"
            ],
            "medications": [
                {{
                    "name": "Medication name",
                    "dosage": "Dosage amount",
                    "frequency": "How often to take",
                    "duration": "How long to take"
                }}
            ],
            "precautions": [
                "List of 3-5 important precautions",
                "Include warning signs to watch for",
                "Include when to seek medical attention"
            ],
            "follow_up": "Follow-up recommendations"
        }}
        
        Important: 
        - Only suggest commonly prescribed, safe medications
        - Include appropriate dosages for adults
        - Provide general medical advice, not specific treatment
        - Include disclaimer that this is for educational purposes
        - Make it realistic and medically sound
        - Return only valid JSON format
        """
        
        try:
            # Prepare the request payload
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ]
            }
            
            # Make the API request
            headers = {
                'Content-Type': 'application/json',
                'X-goog-api-key': self.api_key
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            
            # Parse the response
            response_data = response.json()
            
            # Extract the generated text
            if 'candidates' in response_data and len(response_data['candidates']) > 0:
                generated_text = response_data['candidates'][0]['content']['parts'][0]['text']
                
                # Clean the response text to extract JSON
                response_text = generated_text.strip()
                
                # Remove any markdown formatting if present
                if response_text.startswith('```json'):
                    response_text = response_text[7:]
                if response_text.endswith('```'):
                    response_text = response_text[:-3]
                
                # Parse the JSON response
                prescription_data = json.loads(response_text.strip())
                return prescription_data
            else:
                raise Exception("No valid response from Gemini API")
            
        except requests.exceptions.RequestException as e:
            print(f"Error making request to Gemini API: {e}")
            return self._get_fallback_prescription(disease_name)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            return self._get_fallback_prescription(disease_name)
        except Exception as e:
            print(f"Error generating prescription with Gemini: {e}")
            return self._get_fallback_prescription(disease_name)
    
    def _get_fallback_prescription(self, disease_name: str) -> Dict:
        """Fallback prescription when API fails"""
        return {
            "disease_name": disease_name.title(),
            "general_instructions": [
                "Consult with a healthcare provider for proper diagnosis",
                "Follow prescribed treatment plan",
                "Monitor symptoms regularly",
                "Maintain healthy lifestyle habits",
                "Take medications as directed"
            ],
            "medications": [
                {
                    "name": "Consult physician for appropriate medication",
                    "dosage": "As prescribed",
                    "frequency": "As directed",
                    "duration": "As recommended"
                }
            ],
            "precautions": [
                "Seek immediate medical attention if symptoms worsen",
                "Inform healthcare provider of all medications",
                "Monitor for side effects",
                "Follow up with healthcare provider as scheduled"
            ],
            "follow_up": "Schedule follow-up appointment as recommended by healthcare provider"
        }

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle,
    Spacer, HRFlowable)



def compile_html_to_pdf(disease_info: Dict, patient_name="Patient", doctor_name="Dr. Tantry") -> str:
    output_dir = 'generated_prescriptions'
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = os.path.join(output_dir, f'prescription_{timestamp}.pdf')

    doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=60, bottomMargin=40)
    styles = getSampleStyleSheet()

    # Custom styles
    heading_style = ParagraphStyle('HeadingStyle', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, textColor=colors.darkblue, spaceAfter=10)
    normal_style = ParagraphStyle('NormalStyle', parent=styles['Normal'], fontSize=11, leading=14)
    disclaimer_style = ParagraphStyle('DisclaimerStyle', parent=styles['Normal'], fontSize=9, textColor=colors.red, italic=True)

    story = []

    # Header section
    story.append(Paragraph(f"{doctor_name}", ParagraphStyle('DocName', fontSize=16, fontName='Helvetica-Bold')))
    story.append(Spacer(1, 0.1 * inch))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))



    # Spacer *after* the symbol
    story.append(Spacer(1, 0.2 * inch))

    # Patient Info
    story.append(Paragraph(f"Patient Name: {patient_name}", normal_style))
    story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", normal_style))
    story.append(Paragraph(f"Diagnosis: {disease_info.get('disease_name', 'N/A')}", normal_style))
    story.append(Spacer(1, 0.2 * inch))

    # Medications Table
    story.append(Paragraph("Medications", heading_style))
    meds_data = [["Name", "Dosage", "Frequency", "Duration"]]
    for med in disease_info.get('medications', []):
        meds_data.append([
            med.get("name", ""),
            med.get("dosage", ""),
            med.get("frequency", ""),
            med.get("duration", "")
        ])
    meds_table = Table(meds_data, hAlign='LEFT')
    meds_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10)
    ]))
    story.append(meds_table)
    story.append(Spacer(1, 0.2 * inch))

    # General Instructions
    story.append(Paragraph("General Instructions", heading_style))
    for instr in disease_info.get('general_instructions', []):
        story.append(Paragraph(f"• {instr}", normal_style))
    story.append(Spacer(1, 0.2 * inch))

    # Precautions
    story.append(Paragraph("Precautions", heading_style))
    for prec in disease_info.get('precautions', []):
        story.append(Paragraph(f"• {prec}", normal_style))
    story.append(Spacer(1, 0.2 * inch))

    # Follow-up
    story.append(Paragraph("Follow-up", heading_style))
    story.append(Paragraph(disease_info.get('follow_up', ''), normal_style))
    story.append(Spacer(1, 0.3 * inch))

    # Signature placeholder
    story.append(HRFlowable(width="40%", thickness=0.5, color=colors.grey))
    story.append(Paragraph("Signature", ParagraphStyle('Signature', fontSize=10, alignment=1, spaceBefore=4)))

    # Footer Disclaimer
    story.append(Spacer(1, 0.3 * inch))
    disclaimer = "This document is for demonstration purposes only. Always consult a licensed medical professional for diagnosis or treatment."
    story.append(Paragraph(disclaimer, disclaimer_style))

    # Build PDF
    doc.build(story)
    return output_path


# Initialize the prescription generator
prescription_generator = MedicalPrescriptionGenerator()

@app.route('/')
def index():
    """Simple web interface"""
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Medical Prescription Generator</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, select { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; }
            button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background-color: #0056b3; }
            .disclaimer { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>Medical Prescription Generator</h1>
        
        <div class="disclaimer">
            <strong>Disclaimer:</strong> This tool is for educational and demonstration purposes only. 
            Always consult with a qualified healthcare provider for proper medical diagnosis and treatment.
        </div>
        
        <form id="prescriptionForm">
            <div class="form-group">
                <label for="disease">Disease Name:</label>
                <input type="text" id="disease" name="disease" required placeholder="e.g., diabetes, hypertension, asthma">
            </div>
            
            <div class="form-group">
                <label for="patient_name">Patient Name:</label>
                <input type="text" id="patient_name" name="patient_name" placeholder="Patient Name (optional)">
            </div>
            
            <div class="form-group">
                <label for="doctor_name">Doctor Name:</label>
                <input type="text" id="doctor_name" name="doctor_name" placeholder="Dr. Tantry (optional)">
            </div>
            
            <button type="submit">Generate Prescription PDF</button>
        </form>
        
        <div id="result"></div>
        
        <script>
            document.getElementById('prescriptionForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                document.getElementById('result').innerHTML = '<p>Generating prescription...</p>';
                
                try {
                    const response = await fetch('/generate_prescription', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `prescription_${data.disease}.pdf`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.getElementById('result').innerHTML = '<p style="color: green;">Prescription generated successfully!</p>';
                    } else {
                        const error = await response.json();
                        document.getElementById('result').innerHTML = `<p style="color: red;">Error: ${error.error}</p>`;
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
                }
            });
        </script>
    </body>
    </html>
    """
    return html_template

@app.route('/generate_prescription', methods=['POST'])
def generate_prescription():
    """API endpoint to generate prescription PDF"""
    try:
        data = request.get_json()
        disease_name = data.get('disease', '').strip()
        patient_name = data.get('patient_name', 'Patient').strip() or 'Patient'
        doctor_name = data.get('doctor_name', 'Dr. Tantry').strip() or 'Dr. Tantry'
        
        if not disease_name:
            return jsonify({'error': 'Disease name is required'}), 400
        
        # Generate prescription data using AI
        print(f"Generating prescription for: {disease_name}")
        disease_info = prescription_generator.generate_prescription_data(disease_name)
        
        # Generate LaTeX code
        pdf_path = compile_html_to_pdf(disease_info, patient_name, doctor_name)

        
        return send_file(pdf_path, as_attachment=True, download_name=f'prescription_{disease_name.replace(" ", "_")}.pdf')
        
    except Exception as e:
        print(f"Error generating prescription: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescription/<disease_name>')
def get_prescription_data(disease_name):
    """API endpoint to get prescription data as JSON"""
    try:
        disease_info = prescription_generator.generate_prescription_data(disease_name)
        return jsonify(disease_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Create directories
    os.makedirs('generated_prescriptions', exist_ok=True)
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5020)