@echo off

:: Run DISEASE_PREDICTION_API.py in a new window
start cmd /k "cd backend && python DISEASE_PREDICTION_API.py"

:: Run PRESCRIPTION_PRINTER_API.py in a new window
start cmd /k "cd backend && python PRESCRIPTION_PRINTER_API.py"

:: Run npm install and then npm run dev in a new window
start cmd /k "cd disease_predictor_frontend && npm run dev"
