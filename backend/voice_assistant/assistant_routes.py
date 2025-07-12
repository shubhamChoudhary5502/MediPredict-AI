from flask import Blueprint, request, send_file, jsonify, after_this_request
import os
from .speech_to_text import speech_to_text_from_mic
from .translate_text import translate_to_english
from .text_to_speech import text_to_speech
from utils.prescription_generator import MedicalPrescriptionGenerator

assistant_bp = Blueprint('assistant_bp', __name__)
generator = MedicalPrescriptionGenerator()

@assistant_bp.route('/multimodal-remedy', methods=['POST'])
def multimodal_remedy():
    try:
        voice_text = request.json.get("query")
        translated_text, lang = translate_to_english(voice_text)

        prescription = generator.generate_prescription_data(translated_text)
        first_instruction = prescription['general_instructions'][0]

        tts_path = text_to_speech(first_instruction, lang_code=lang, output_file="response.mp3")
        return send_file(tts_path, mimetype="audio/mpeg", as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ ADD THIS NEW ROUTE
@assistant_bp.route('/text-predict', methods=['POST'])
def text_predict():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Convert text to speech (Hindi)
        output_path = text_to_speech(text, lang_code='hi')

        @after_this_request
        def remove_file(response):
            try:
                os.remove(output_path)
            except Exception as e:
                print(f"Cleanup failed for {output_path}: {e}")
            return response

        return send_file(output_path, mimetype='audio/mpeg', as_attachment=False)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
