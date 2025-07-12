import React, { useState, useEffect } from 'react';
import { Search, Activity, AlertCircle, CheckCircle, XCircle, FileText, Brain, Heart, Stethoscope, Users, Clock, TrendingUp, Plus, Minus, X } from 'lucide-react';
import VoiceAssistant from "./components/VoiceAssistant";

const API_BASE_URL = (window.location.hostname !== 'localhost') ? `http://${window.location.hostname}:5000`:'http://localhost:5000';
const API_PRESCRIBE = (window.location.hostname !== 'localhost') ? `http://${window.location.hostname}:5020` : 'http://localhost:5020';

const DiseasePredictionApp = () => {
  const [symptoms, setSymptoms] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [topK, setTopK] = useState(5);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');
  const [searchTerm, setSearchTerm] = useState('');

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
    fetchAvailableSymptoms();
  }, []);

  // Sync selected symptoms with text input
  useEffect(() => {
    setSymptoms(selectedSymptoms.join(', '));
  }, [selectedSymptoms]);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      setApiHealth(data);
    } catch (err) {
      setApiHealth({ status: 'error', message: 'API not reachable' });
    }
  };

  const handleGeneratePrescription = async (diseaseName) => {
  try {
    const response = await fetch(`${API_PRESCRIBE}/generate_prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        disease: diseaseName,
        patient_name: 'Patient', // Optional: replace with real input if needed
        doctor_name: 'Dr. Tantry' // Optional: replace with real input if needed
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${diseaseName}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      console.error('Failed to generate prescription.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};


  const fetchAvailableSymptoms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/symptoms`);
      const data = await response.json();
      if (data.success) {
        setAvailableSymptoms(data.symptoms);
      }
    } catch (err) {
      console.error('Failed to fetch symptoms:', err);
    }
  };

  const addSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      setActiveTab('predict'); // Switch to predict tab when symptom is added
    }
  };

  const removeSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const clearAllSymptoms = () => {
    setSelectedSymptoms([]);
    setSymptoms('');
  };

  const handleSymptomsTextChange = (e) => {
    const text = e.target.value;
    setSymptoms(text);
    // Parse the text input and update selected symptoms
    const symptomsArray = text.split(',').map(s => s.trim()).filter(s => s);
    setSelectedSymptoms(symptomsArray);
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          top_k: topK
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPrediction(data);
      } else {
        setError(data.error || 'Prediction failed');
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Model trained successfully!');
        checkApiHealth();
        fetchAvailableSymptoms();
      } else {
        setError(data.error || 'Training failed');
      }
    } catch (err) {
      setError('Failed to train model');
    } finally {
      setLoading(false);
    }
  };

  const handleExamplePrediction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/predict_example`);
      const data = await response.json();
      
      if (data.success) {
        setPrediction(data);
        setSelectedSymptoms(['fever', 'cough', 'headache']);
      } else {
        setError(data.error || 'Example prediction failed');
      }
    } catch (err) {
      setError('Failed to get example prediction');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'High': return 'from-emerald-500 to-teal-600';
      case 'Medium': return 'from-amber-500 to-orange-600';
      case 'Low': return 'from-rose-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'High': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Low': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getHealthStatusIcon = () => {
    if (!apiHealth) return <Clock className="w-4 h-4 text-gray-400" />;
    if (apiHealth.status === 'healthy') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    return <XCircle className="w-4 h-4 text-rose-400" />;
  };

  const filteredSymptoms = availableSymptoms.filter(symptom =>
    symptom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
        <VoiceAssistant />
      </div>
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-75"></div>
                <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  MediPredict AI
                </h1>
                <p className="text-slate-400 text-sm">Advanced Disease Prediction System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 bg-slate-700/50 rounded-full px-4 py-2 border border-slate-600/50">
              {getHealthStatusIcon()}
              <span className="text-sm text-slate-300">
                {apiHealth?.status === 'healthy' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Available Symptoms</p>
                <p className="text-3xl font-bold text-white mt-1">{availableSymptoms.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Diseases</p>
                <p className="text-3xl font-bold text-white mt-1">{apiHealth?.diseases_count || 0}</p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Model Features</p>
                <p className="text-3xl font-bold text-white mt-1">{apiHealth?.features_count || 0}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Model Status</p>
                <p className="text-lg font-semibold text-white mt-1">
                  {apiHealth?.model_trained ? 'Ready' : 'Not Ready'}
                </p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Heart className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Symptoms Bar */}
        {selectedSymptoms.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-400 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Selected Symptoms ({selectedSymptoms.length})
              </h3>
              <button
                onClick={clearAllSymptoms}
                className="text-slate-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((symptom, index) => (
                <span
                  key={index}
                  className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30 flex items-center space-x-2 group"
                >
                  <span>{symptom}</span>
                  <button
                    onClick={() => removeSymptom(symptom)}
                    className="text-blue-300 hover:text-white transition-colors duration-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="flex border-b border-slate-700/50">
            <button 
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'predict' 
                  ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              onClick={() => setActiveTab('predict')}
            >
              <div className="flex items-center justify-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Predict Disease</span>
              </div>
            </button>
            <button 
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'symptoms' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              onClick={() => setActiveTab('symptoms')}
            >
              <div className="flex items-center justify-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Browse Symptoms</span>
              </div>
            </button>
            <button 
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                activeTab === 'manage' 
                  ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              onClick={() => setActiveTab('manage')}
            >
              <div className="flex items-center justify-center space-x-2">
                <Brain className="w-4 h-4" />
                <span>Manage Model</span>
              </div>
            </button>
          </div>

          <div className="p-8">
            {/* Predict Tab */}
            {activeTab === 'predict' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-3">Disease Prediction</h2>
                  <p className="text-slate-400 text-lg">Select symptoms from the catalog or enter them manually</p>
                </div>

                {error && (
                  <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-4 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <span className="text-rose-200">{error}</span>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Enter Symptoms (or select from Browse Symptoms tab)
                    </label>
                    <textarea
                      className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none"
                      placeholder="e.g., fever, cough, headache, fatigue"
                      value={symptoms}
                      onChange={handleSymptomsTextChange}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Number of Predictions
                    </label>
                    <select 
                      className="w-full md:w-auto bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                      value={topK}
                      onChange={(e) => setTopK(Number(e.target.value))}
                    >
                      <option value={3}>Top 3 Predictions</option>
                      <option value={5}>Top 5 Predictions</option>
                      <option value={10}>Top 10 Predictions</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    onClick={handlePredict}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Search className="w-5 h-5" />
                        <span>Predict Diseases</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
                    onClick={handleExamplePrediction}
                    disabled={loading}
                  >
                    Try Example
                  </button>
                </div>

                {/* Prediction Results */}
                {prediction && (
                  <div className="mt-12 space-y-8">
                    <div className="flex items-center justify-center">
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1"></div>
                      <span className="px-6 text-lg font-semibold text-slate-300">Prediction Results</span>
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1"></div>
                    </div>

                    {/* Symptom Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                        <h3 className="font-semibold text-emerald-400 mb-4 flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Matched Symptoms ({prediction.matched_count})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {prediction.matched_symptoms.map((symptom, index) => (
                            <span key={index} className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm border border-emerald-500/30">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6">
                        <h3 className="font-semibold text-rose-400 mb-4 flex items-center">
                          <XCircle className="w-5 h-5 mr-2" />
                          Unmatched Symptoms ({prediction.unmatched_count})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {prediction.unmatched_symptoms.map((symptom, index) => (
                            <span key={index} className="bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-sm border border-rose-500/30">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Disease Predictions */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-white">Possible Diseases</h3>
                      <div className="space-y-4">
                        {prediction.predictions.map((pred, index) => (
                          <div key={index} className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6 hover:border-slate-500/50 transition-all duration-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="bg-slate-600/50 rounded-full w-10 h-10 flex items-center justify-center">
                                  <span className="text-blue-400 font-bold">#{index + 1}</span>
                                </div>
                                <div>
                                  <h4 className="text-xl font-semibold text-white">{pred.disease}</h4>
                                  <p className="text-slate-400 text-sm">{(pred.probability * 100).toFixed(1)}% match probability</p>
                                </div>
                              </div>
                              <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getConfidenceBadge(pred.confidence)}`}>
                                {pred.confidence}
                              </div>
                            </div>
                            
                            <div className="relative">
                              <div className="h-2 bg-slate-600/50 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${getConfidenceColor(pred.confidence)} transition-all duration-1000 ease-out`}
                                  style={{ width: `${pred.probability * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {prediction.predictions[0].probability >= 0.75 && (
                        <div className="mt-6 text-center">
                          <button
                            className="inline-flex items-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                            onClick={() => handleGeneratePrescription(prediction.predictions[0].disease)}
                          >
                            <FileText className="w-5 h-5 mr-2" />
                            Get Prescription for {prediction.predictions[0].disease}
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Symptoms Tab */}
            {activeTab === 'symptoms' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-3">Available Symptoms</h2>
                  <p className="text-slate-400 text-lg">Click on symptoms to add them to your selection</p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search symptoms..."
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                      {searchTerm ? filteredSymptoms.length : availableSymptoms.length}
                    </div>
                    <div className="text-slate-400">
                      {searchTerm ? 'Filtered' : 'Total'} Symptoms Available
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-6 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredSymptoms.map((symptom, index) => (
                      <button
                        key={index}
                        onClick={() => addSymptom(symptom)}
                        className={`text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 border ${
                          selectedSymptoms.includes(symptom)
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 hover:text-white border-slate-500/30 hover:border-slate-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{symptom}</span>
                          {selectedSymptoms.includes(symptom) ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Plus className="w-4 h-4 text-slate-400 group-hover:text-white" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {filteredSymptoms.length === 0 && searchTerm && (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No symptoms found matching "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manage Tab */}
            {activeTab === 'manage' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-3">Model Management</h2>
                  <p className="text-slate-400 text-lg">Train and monitor your AI prediction model</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6">Current Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-slate-600/30">
                        <span className="text-slate-300">Model Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          apiHealth?.model_trained ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {apiHealth?.model_trained ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-slate-600/30">
                        <span className="text-slate-300">Features Count</span>
                        <span className="text-white font-semibold">{apiHealth?.features_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-slate-300">Diseases Count</span>
                        <span className="text-white font-semibold">{apiHealth?.diseases_count || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-6">Actions</h3>
                    <div className="space-y-4">
                      <button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        onClick={handleTrainModel}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Training Model...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Brain className="w-5 h-5" />
                            <span>Train Model</span>
                          </div>
                        )}
                      </button>
                      
                      <button
                        className="w-full bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 hover:text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 border border-slate-500/50 hover:border-slate-400/50"
                        onClick={checkApiHealth}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Activity className="w-5 h-5" />
                          <span>Check API Health</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-400 mb-2">Important Note</h3>
                      <p className="text-blue-200 text-sm leading-relaxed">
                        Ensure the CSV file "Final_Augmented_dataset_Diseases_and_Symptoms.csv" is present in your backend directory before training the model. The training process may take several minutes depending on your system specifications.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseasePredictionApp;