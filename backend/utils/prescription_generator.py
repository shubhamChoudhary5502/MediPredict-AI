import json
import requests
from typing import Dict
from datetime import datetime

GEMINI_API_KEY = "AIzaSyAgi2UmNFRvtDsXRwbOiDZQGwAY6b_GE7Y"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

class MedicalPrescriptionGenerator:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.api_url = GEMINI_API_URL

    def generate_prescription_data(self, disease_name: str) -> Dict:
        # [Paste the same code you already wrote]
        ...
    
    def _get_fallback_prescription(self, disease_name: str) -> Dict:
        # [Paste fallback method too]
        ...
