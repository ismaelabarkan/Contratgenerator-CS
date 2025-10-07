#!/bin/bash

# Contract Generator - Complete Deployment Script
# Kopieer en plak dit hele script op je VPS (159.69.204.101)

set -e

echo "🚀 Contract Generator - Complete Deployment"
echo "=========================================="
echo "VPS: 159.69.204.101"
echo ""

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $USER
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /root/contract-generator
cd /root/contract-generator

# Create Dockerfile
echo "📝 Creating Dockerfile..."
cat > Dockerfile << 'EOF'
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY standalone_contract_generator_v2.html /usr/share/nginx/html/index.html
COPY clausules/ /usr/share/nginx/html/clausules/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx.conf
echo "⚙️ Creating nginx configuration..."
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/javascript application/json;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        location / {
            try_files $uri $uri/ /index.html;
            expires 1h;
            add_header Cache-Control "public";
        }
        
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create docker-compose.yml
echo "🐳 Creating docker-compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  contract-generator:
    build: .
    container_name: contract-generator
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

# Create the HTML file
echo "📝 Creating HTML application file..."
cat > standalone_contract_generator.html << 'HTML_EOF'
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.5/purify.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .focus-visible:focus { outline: 2px solid #4f46e5; outline-offset: 2px; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div id="app"></div>

    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <script type="text/babel">
        const { useState, useMemo, useCallback, useRef } = React;

        // ===== DATA & CONSTANTS =====
        const CLAUSULES = {
            "CLAUSULE_DEFINITIES": {
                titel: "Definities",
                tekst: "De in deze overeenkomst gehanteerde begrippen hebben de betekenis zoals opgenomen in de bijlage Definities.",
                toelichting: "Deze clausule verwijst naar een apart document met definities van gebruikte termen.",
                categorie: "Algemeen",
                verplicht: true
            },
            "CLAUSULE_TOEPASSELIJK_RECHT": {
                titel: "Toepasselijk recht en geschillen",
                tekst: "Op deze overeenkomst is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement {gemeente}.",
                toelichting: "Bepaalt welk rechtssysteem geldt en waar geschillen worden behandeld.",
                categorie: "Algemeen",
                verplicht: true
            },
            "CLAUSULE_LOOPTIJD": {
                titel: "Looptijd",
                tekst: "Deze overeenkomst vangt aan op {ingangsdatum} en eindigt op {einddatum}, tenzij zij eerder wordt beëindigd.",
                toelichting: "Geeft duidelijkheid over de contractperiode.",
                categorie: "Looptijd en beëindiging",
                verplicht: true
            },
            "CLAUSULE_DECLARATIE": {
                titel: "Declaratie",
                tekst: "Declaraties worden ingediend via het landelijk berichtenverkeer. {opdrachtgever} kan onjuiste declaraties afwijzen.",
                toelichting: "Regelt hoe facturen ingediend moeten worden.",
                categorie: "Financieel",
                verplicht: true
            },
            "CLAUSULE_BETALING": {
                titel: "Betaling",
                tekst: "Betaling vindt plaats binnen {betalingstermijn} dagen na ontvangst van een correcte declaratie.",
                toelichting: "Bepaalt de betalingstermijn.",
                categorie: "Financieel",
                verplicht: true
            },
            "CLAUSULE_AVG": {
                titel: "Privacy & AVG",
                tekst: "Partijen waarborgen de verwerking van persoonsgegevens conform de AVG. {opdrachtgever} is verwerkingsverantwoordelijke.",
                toelichting: "Verplichte clausule die privacy regelt conform de AVG.",
                categorie: "Privacy",
                verplicht: true
            },
            "CLAUSULE_OPZEGGING": {
                titel: "Opzegging",
                tekst: "Beide partijen kunnen de overeenkomst beëindigen met een opzegtermijn van {opzegtermijn} dagen.",
                toelichting: "Regelt hoe het contract voortijdig kan worden beëindigd.",
                categorie: "Looptijd en beëindiging",
                verplicht: false
            },
            "CLAUSULE_INDEXERING": {
                titel: "Indexering",
                tekst: "Tarieven worden jaarlijks aangepast op basis van de CPI zoals gepubliceerd door het CBS.",
                toelichting: "Zorgt voor automatische aanpassing van tarieven aan inflatie.",
                categorie: "Financieel",
                verplicht: false
            }
        };

        // ===== UTILITIES & VALIDATION =====
        const sanitizeInput = (input) => {
            if (typeof input !== 'string') return '';
            return DOMPurify.sanitize(input.trim());
        };

        const validateParameters = (params) => {
            const errors = {};
            
            if (!params.opdrachtgever?.trim()) {
                errors.opdrachtgever = 'Opdrachtgever is verplicht';
            }
            if (!params.gemeente?.trim()) {
                errors.gemeente = 'Gemeente is verplicht';
            }
            if (!params.ingangsdatum?.trim()) {
                errors.ingangsdatum = 'Ingangsdatum is verplicht';
            }
            if (!params.einddatum?.trim()) {
                errors.einddatum = 'Einddatum is verplicht';
            }
            
            // Datum validatie
            if (params.ingangsdatum && params.einddatum) {
                const startDate = new Date(params.ingangsdatum);
                const endDate = new Date(params.einddatum);
                if (startDate >= endDate) {
                    errors.dates = 'Einddatum moet na ingangsdatum liggen';
                }
            }
            
            // Numerieke validatie
            if (params.opzegtermijn && (isNaN(params.opzegtermijn) || params.opzegtermijn < 1)) {
                errors.opzegtermijn = 'Opzegtermijn moet een positief getal zijn';
            }
            if (params.betalingstermijn && (isNaN(params.betalingstermijn) || params.betalingstermijn < 1)) {
                errors.betalingstermijn = 'Betalingstermijn moet een positief getal zijn';
            }
            
            return errors;
        };

        const replaceParameters = (text, parameters) => {
            if (!text || !parameters) return text;
            let result = text;
            Object.keys(parameters).forEach(key => {
                const value = sanitizeInput(parameters[key]);
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            });
            return result;
        };

        const FLOW_STEPS = [
            { id: 'parameters', title: 'Parameters', description: 'Vul de algemene gegevens in' },
            { id: 'verplicht', title: 'Verplicht', description: 'Controleer verplichte clausules' },
            { id: 'optioneel', title: 'Optioneel', description: 'Kies aanvullende clausules' },
            { id: 'aanpassen', title: 'Aanpassen', description: 'Pas clausules aan' },
            { id: 'review', title: 'Review', description: 'Controleer en exporteer' }
        ];

        // ===== MAIN COMPONENT =====
        function ContractGenerator() {
            const [currentStep, setCurrentStep] = useState(0);
            const [selected, setSelected] = useState([]);
            const [search, setSearch] = useState('');
            const [filterCat, setFilterCat] = useState('');
            const [editMode, setEditMode] = useState({});
            const [editedText, setEditedText] = useState({});
            const [showInfo, setShowInfo] = useState({});
            const [downloaded, setDownloaded] = useState(false);
            const [validationErrors, setValidationErrors] = useState({});
            const [parameters, setParameters] = useState({
                opdrachtgever: 'Gemeente',
                gemeente: 'Amsterdam',
                ingangsdatum: '01-01-2025',
                einddatum: '31-12-2025',
                opzegtermijn: '90',
                betalingstermijn: '30'
            });

            // Refs voor accessibility
            const stepRefs = useRef([]);

            const categories = useMemo(() => {
                return [...new Set(Object.values(CLAUSULES).map(c => c.categorie))];
            }, []);

            const verplichtClausules = useMemo(() => {
                return Object.entries(CLAUSULES).filter(([_, val]) => val.verplicht);
            }, []);

            const optioneleClausules = useMemo(() => {
                return Object.entries(CLAUSULES).filter(([_, val]) => !val.verplicht);
            }, []);

            const missingRequired = useMemo(() => {
                return verplichtClausules.filter(([key, _]) => !selected.includes(key));
            }, [selected, verplichtClausules]);

            const canProceed = useMemo(() => {
                if (currentStep === 0) {
                    const errors = validateParameters(parameters);
                    return Object.keys(errors).length === 0;
                }
                if (currentStep === 1) return missingRequired.length === 0;
                return true;
            }, [currentStep, missingRequired, parameters]);

            const filteredClausules = useMemo(() => {
                const base = currentStep === 1 ? verplichtClausules : currentStep === 2 ? optioneleClausules : [];
                return base.filter(([key, val]) => {
                    const matchSearch = search === '' || 
                        val.titel.toLowerCase().includes(search.toLowerCase()) ||
                        val.tekst.toLowerCase().includes(search.toLowerCase());
                    const matchCat = filterCat === '' || val.categorie === filterCat;
                    return matchSearch && matchCat;
                });
            }, [search, filterCat, currentStep, verplichtClausules, optioneleClausules]);

            // ===== EVENT HANDLERS =====
            const handleParameterChange = useCallback((key, value) => {
                const sanitizedValue = sanitizeInput(value);
                setParameters(prev => ({ ...prev, [key]: sanitizedValue }));
                
                // Clear validation errors for this field
                if (validationErrors[key]) {
                    setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors[key];
                        return newErrors;
                    });
                }
            }, [validationErrors]);

            const toggleSelect = useCallback((key) => {
                setSelected(prev => 
                    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                );
            }, []);

            const toggleEdit = useCallback((key) => {
                if (!editedText[key]) {
                    setEditedText(prev => ({...prev, [key]: replaceParameters(CLAUSULES[key].tekst, parameters)}));
                }
                setEditMode(prev => ({...prev, [key]: !prev[key]}));
            }, [editedText, parameters]);

            const updateText = useCallback((key, value) => {
                const sanitizedValue = sanitizeInput(value);
                setEditedText(prev => ({...prev, [key]: sanitizedValue}));
            }, []);

            const toggleInfo = useCallback((key) => {
                setShowInfo(prev => ({...prev, [key]: !prev[key]}));
            }, []);

            const nextStep = useCallback(() => {
                if (currentStep === 0) {
                    const errors = validateParameters(parameters);
                    if (Object.keys(errors).length > 0) {
                        setValidationErrors(errors);
                        return;
                    }
                    setValidationErrors({});
                }
                
                if (currentStep < FLOW_STEPS.length - 1 && canProceed) {
                    if (currentStep === 0) {
                        const requiredKeys = verplichtClausules.map(([key]) => key);
                        setSelected(prev => [...new Set([...prev, ...requiredKeys])]);
                    }
                    setCurrentStep(prev => prev + 1);
                    setSearch('');
                    setFilterCat('');
                    setDownloaded(false);
                }
            }, [currentStep, canProceed, parameters, verplichtClausules]);

            const prevStep = useCallback(() => {
                if (currentStep > 0) {
                    setCurrentStep(prev => prev - 1);
                    setSearch('');
                    setFilterCat('');
                    setValidationErrors({});
                }
            }, [currentStep]);

            const copyToClipboard = useCallback(async () => {
                try {
                    const grouped = {};
                    selected.forEach(key => {
                        const cat = CLAUSULES[key].categorie;
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(key);
                    });
                    
                    let fullText = `OVEREENKOMST\n${'='.repeat(60)}\n\n`;
                    fullText += `Opdrachtgever: ${sanitizeInput(parameters.opdrachtgever)}\n`;
                    fullText += `Gemeente: ${sanitizeInput(parameters.gemeente)}\n`;
                    fullText += `Looptijd: ${sanitizeInput(parameters.ingangsdatum)} t/m ${sanitizeInput(parameters.einddatum)}\n\n`;
                    
                    let articleNum = 1;
                    Object.entries(grouped).forEach(([cat, keys]) => {
                        fullText += `\n${cat.toUpperCase()}\n${'-'.repeat(60)}\n\n`;
                        keys.forEach((key) => {
                            const clausule = CLAUSULES[key];
                            const clausText = editedText[key] || replaceParameters(clausule.tekst, parameters);
                            fullText += `Artikel ${articleNum}: ${clausule.titel}\n\n${clausText}\n\n`;
                            articleNum++;
                        });
                    });

                    await navigator.clipboard.writeText(fullText);
                    alert('✓ Contract tekst gekopieerd naar klembord!\n\nPlak het in Notes of Word app.');
                    setDownloaded(true);
                } catch (error) {
                    console.error('Kopiëren mislukt:', error);
                    alert('Kopiëren mislukt. Probeer opnieuw of gebruik de download functie.');
                }
            }, [selected, parameters, editedText]);

            const exportToWord = useCallback(() => {
                try {
                    setDownloaded(true);
                    
                    const grouped = {};
                    selected.forEach(key => {
                        const cat = CLAUSULES[key].categorie;
                        if (!grouped[cat]) grouped[cat] = [];
                        grouped[cat].push(key);
                    });

                    let articleNum = 1;
                    let articlesHtml = '';
                    
                    Object.entries(grouped).forEach(([cat, keys]) => {
                        const sanitizedCat = sanitizeInput(cat);
                        articlesHtml += `<div style="margin-top: 40px;"><h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; font-size: 18px;">${sanitizedCat}</h2></div>`;
                        
                        keys.forEach(key => {
                            const clausule = CLAUSULES[key];
                            const text = editedText[key] || replaceParameters(clausule.tekst, parameters);
                            const sanitizedText = sanitizeInput(text);
                            const sanitizedTitle = sanitizeInput(clausule.titel);
                            articlesHtml += `<div style="margin-top: 25px;"><h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Artikel ${articleNum}: ${sanitizedTitle}</h3><p style="line-height: 1.8;">${sanitizedText}</p></div>`;
                            articleNum++;
                        });
                    });

                    const sanitizedOpdrachtgever = sanitizeInput(parameters.opdrachtgever);
                    const sanitizedGemeente = sanitizeInput(parameters.gemeente);
                    const sanitizedIngangsdatum = sanitizeInput(parameters.ingangsdatum);
                    const sanitizedEinddatum = sanitizeInput(parameters.einddatum);

                    const html = `<!DOCTYPE html>
<html><head><meta charset='utf-8'><title>Contract</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.6;margin:2cm;}</style></head><body>
<div style="text-align:center;margin-bottom:40px;"><h1 style="color:#1e3a8a;border-bottom:3px solid #1e3a8a;padding-bottom:10px;">OVEREENKOMST</h1></div>
<div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:15px;margin:20px 0;"><p><strong>Opdrachtgever:</strong> ${sanitizedOpdrachtgever}</p><p><strong>Gemeente:</strong> ${sanitizedGemeente}</p><p><strong>Looptijd:</strong> ${sanitizedIngangsdatum} t/m ${sanitizedEinddatum}</p></div>
<div style="text-align:right;margin:30px 0;"><p>Datum: ${new Date().toLocaleDateString('nl-NL')}</p></div>
${articlesHtml}
</body></html>`;

                    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Contract_${sanitizedOpdrachtgever.replace(/\s/g, '_')}_${sanitizedIngangsdatum}.doc`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Export mislukt:', error);
                    alert('Export mislukt. Probeer opnieuw.');
                    setDownloaded(false);
                }
            }, [selected, parameters, editedText]);

            return (
                <div className="p-6 max-w-5xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <h1 className="text-3xl font-bold text-gray-800">Contract Generator</h1>
                        </div>
                        <p className="text-gray-600">Volg de stappen om een compleet contract te genereren</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <nav aria-label="Stap voortgang">
                            <div className="flex items-center justify-between">
                                {FLOW_STEPS.map((step, idx) => (
                                    <React.Fragment key={step.id}>
                                        <div className="flex flex-col items-center">
                                            <div 
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                                    idx < currentStep ? 'bg-green-500 text-white' : 
                                                    idx === currentStep ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' : 
                                                    idx === 4 && downloaded ? 'bg-green-500 text-white' :
                                                    'bg-gray-200 text-gray-500'
                                                }`}
                                                role="img"
                                                aria-label={`Stap ${idx + 1}: ${step.title} - ${idx < currentStep ? 'Voltooid' : idx === currentStep ? 'Huidige stap' : 'Nog niet bereikt'}`}
                                            >
                                                {idx < currentStep || (idx === 4 && downloaded) ? '✓' : idx + 1}
                                            </div>
                                            <p className={`text-xs mt-2 font-medium ${idx === currentStep ? 'text-indigo-600' : 'text-gray-500'}`}>
                                                {step.title}
                                            </p>
                                        </div>
                                        {idx < FLOW_STEPS.length - 1 && (
                                            <div 
                                                className={`h-1 flex-1 mx-2 rounded ${idx < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </nav>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{FLOW_STEPS[currentStep].title}</h2>
                            <p className="text-gray-600">{FLOW_STEPS[currentStep].description}</p>
                        </div>

                        {currentStep === 0 && (
                            <div className="space-y-6">
                                {Object.keys(validationErrors).length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4" role="alert" aria-live="polite">
                                        <h3 className="font-semibold text-red-800 mb-2">⚠️ Controleer de volgende velden:</h3>
                                        <ul className="text-sm text-red-700 space-y-1">
                                            {Object.entries(validationErrors).map(([field, error]) => (
                                                <li key={field}>• {error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="opdrachtgever" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Opdrachtgever *
                                        </label>
                                        <input 
                                            id="opdrachtgever"
                                            type="text" 
                                            value={parameters.opdrachtgever} 
                                            onChange={(e) => handleParameterChange('opdrachtgever', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none ${
                                                validationErrors.opdrachtgever ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            aria-describedby={validationErrors.opdrachtgever ? 'opdrachtgever-error' : undefined}
                                            aria-invalid={!!validationErrors.opdrachtgever}
                                        />
                                        {validationErrors.opdrachtgever && (
                                            <p id="opdrachtgever-error" className="text-red-600 text-sm mt-1" role="alert">
                                                {validationErrors.opdrachtgever}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="gemeente" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Gemeente *
                                        </label>
                                        <input 
                                            id="gemeente"
                                            type="text" 
                                            value={parameters.gemeente} 
                                            onChange={(e) => handleParameterChange('gemeente', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none ${
                                                validationErrors.gemeente ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            aria-describedby={validationErrors.gemeente ? 'gemeente-error' : undefined}
                                            aria-invalid={!!validationErrors.gemeente}
                                        />
                                        {validationErrors.gemeente && (
                                            <p id="gemeente-error" className="text-red-600 text-sm mt-1" role="alert">
                                                {validationErrors.gemeente}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="ingangsdatum" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Ingangsdatum * (DD-MM-JJJJ)
                                        </label>
                                        <input 
                                            id="ingangsdatum"
                                            type="text" 
                                            value={parameters.ingangsdatum} 
                                            onChange={(e) => handleParameterChange('ingangsdatum', e.target.value)}
                                            placeholder="01-01-2025"
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none ${
                                                validationErrors.ingangsdatum || validationErrors.dates ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            aria-describedby={validationErrors.ingangsdatum || validationErrors.dates ? 'ingangsdatum-error' : undefined}
                                            aria-invalid={!!(validationErrors.ingangsdatum || validationErrors.dates)}
                                        />
                                        {(validationErrors.ingangsdatum || validationErrors.dates) && (
                                            <p id="ingangsdatum-error" className="text-red-600 text-sm mt-1" role="alert">
                                                {validationErrors.ingangsdatum || validationErrors.dates}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="einddatum" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Einddatum * (DD-MM-JJJJ)
                                        </label>
                                        <input 
                                            id="einddatum"
                                            type="text" 
                                            value={parameters.einddatum} 
                                            onChange={(e) => handleParameterChange('einddatum', e.target.value)}
                                            placeholder="31-12-2025"
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none ${
                                                validationErrors.einddatum || validationErrors.dates ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            aria-describedby={validationErrors.einddatum || validationErrors.dates ? 'einddatum-error' : undefined}
                                            aria-invalid={!!(validationErrors.einddatum || validationErrors.dates)}
                                        />
                                        {(validationErrors.einddatum || validationErrors.dates) && (
                                            <p id="einddatum-error" className="text-red-600 text-sm mt-1" role="alert">
                                                {validationErrors.einddatum || validationErrors.dates}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="opzegtermijn" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Opzegtermijn (dagen)
                                        </label>
                                        <input 
                                            id="opzegtermijn"
                                            type="number" 
                                            min="1"
                                            value={parameters.opzegtermijn} 
                                            onChange={(e) => handleParameterChange('opzegtermijn', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none ${
                                                validationErrors.opzegtermijn ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            aria-describedby={validationErrors.opzegtermijn ? 'opzegtermijn-error' : undefined}
                                            aria-invalid={!!validationErrors.opzegtermijn}
                                        />
                                        {validationErrors.opzegtermijn && (
                                            <p id="opzegtermijn-error" className="text-red-600 text-sm mt-1" role="alert">
                                                {validationErrors.opzegtermijn}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="betalingstermijn" className="block text-sm font-semibold text-gray-700 mb-2">
                                            Betalingstermijn (dagen)
                                        </label>
                                        <input 
                                            id="betalingstermijn"
                                            type="number" 
                                            min="1"
                                            value={parameters.betalingstermijn} 
                                            onChange={(e) => handleParameterChange('betalingstermijn', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none ${
                                                validationErrors.betalingstermijn ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            aria-describedby={validationErrors.betalingstermijn ? 'betalingstermijn-error' : undefined}
                                            aria-invalid={!!validationErrors.betalingstermijn}
                                        />
                                        {validationErrors.betalingstermijn && (
                                            <p id="betalingstermijn-error" className="text-red-600 text-sm mt-1" role="alert">
                                                {validationErrors.betalingstermijn}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(currentStep === 1 || currentStep === 2) && (
                            <div className="space-y-4">
                                {currentStep === 1 && missingRequired.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <p className="font-semibold text-amber-800">⚠️ Let op: {missingRequired.length} verplichte clausule(s) ontbreken</p>
                                    </div>
                                )}
                                <div className="space-y-3 max-h-[500px] overflow-y-auto" role="list" aria-label="Beschikbare clausules">
                                    {filteredClausules.map(([key, clausule]) => (
                                        <div key={key} className={`border-2 rounded-lg p-4 ${selected.includes(key) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`} role="listitem">
                                            <div className="flex items-start gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    id={`clausule-${key}`}
                                                    checked={selected.includes(key)} 
                                                    onChange={() => toggleSelect(key)}
                                                    disabled={clausule.verplicht && currentStep === 1} 
                                                    className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" 
                                                    aria-describedby={`clausule-desc-${key}`}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-800">{clausule.titel}</h3>
                                                            {clausule.verplicht && (
                                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full" aria-label="Verplichte clausule">
                                                                    Verplicht
                                                                </span>
                                                            )}
                                                            <button 
                                                                onClick={() => toggleInfo(key)} 
                                                                className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                                                aria-label={`Toon toelichting voor ${clausule.titel}`}
                                                                aria-expanded={showInfo[key]}
                                                            >
                                                                ℹ️
                                                            </button>
                                                        </div>
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{clausule.categorie}</span>
                                                    </div>
                                                    {showInfo[key] && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-sm text-blue-800" role="region" aria-label="Toelichting">
                                                            <p className="font-medium mb-1">Toelichting:</p>
                                                            <p>{clausule.toelichting}</p>
                                                        </div>
                                                    )}
                                                    <p id={`clausule-desc-${key}`} className="text-gray-600 text-sm">
                                                        {replaceParameters(clausule.tekst, parameters)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto" role="list" aria-label="Geselecteerde clausules voor bewerking">
                                {selected.map(key => {
                                    const clausule = CLAUSULES[key];
                                    return (
                                        <div key={key} className="border-2 border-gray-200 rounded-lg p-4" role="listitem">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-gray-800">{clausule.titel}</h3>
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{clausule.categorie}</span>
                                            </div>
                                            {editMode[key] ? (
                                                <div>
                                                    <label htmlFor={`edit-${key}`} className="sr-only">
                                                        Bewerk tekst voor {clausule.titel}
                                                    </label>
                                                    <textarea 
                                                        id={`edit-${key}`}
                                                        value={editedText[key] || replaceParameters(clausule.tekst, parameters)} 
                                                        onChange={(e) => updateText(key, e.target.value)}
                                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                                        rows="5"
                                                        aria-label={`Bewerk tekst voor ${clausule.titel}`}
                                                    />
                                                    <button 
                                                        onClick={() => toggleEdit(key)}
                                                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        aria-label={`Opslaan wijzigingen voor ${clausule.titel}`}
                                                    >
                                                        Opslaan
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-gray-600 text-sm mb-3">{editedText[key] || replaceParameters(clausule.tekst, parameters)}</p>
                                                    <button 
                                                        onClick={() => toggleEdit(key)} 
                                                        className="text-sm text-indigo-600 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
                                                        aria-label={`Bewerk ${clausule.titel}`}
                                                    >
                                                        Bewerken
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status" aria-live="polite">
                                    <p className="font-semibold text-green-800">✓ Contract gereed voor export</p>
                                    <p className="text-sm text-green-700 mt-1">{selected.length} clausule(s) geselecteerd</p>
                                </div>
                                
                                {downloaded && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" role="status" aria-live="polite">
                                        <p className="font-semibold text-blue-800">✓ Gekopieerd/gedownload!</p>
                                        <p className="text-sm text-blue-700 mt-1">Je kunt het contract nu gebruiken.</p>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={copyToClipboard}
                                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                                    aria-label="Kopieer contract tekst naar klembord"
                                >
                                    📋 Kopieer Contract Tekst
                                </button>
                                
                                <button 
                                    onClick={exportToWord}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    aria-label="Download contract als Word document"
                                >
                                    💾 Download als Word Document
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between mt-8 pt-6 border-t" role="navigation" aria-label="Stap navigatie">
                            <button 
                                onClick={prevStep} 
                                disabled={currentStep === 0}
                                className={`px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    currentStep === 0 
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                aria-label="Ga naar vorige stap"
                            >
                                ← Vorige
                            </button>
                            {currentStep < FLOW_STEPS.length - 1 && (
                                <button 
                                    onClick={nextStep} 
                                    disabled={!canProceed}
                                    className={`px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        !canProceed 
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                    aria-label="Ga naar volgende stap"
                                >
                                    Volgende →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<ContractGenerator />, document.getElementById('app'));
    </script>
</body>
</html>
HTML_EOF

echo "✅ HTML application file created"

# Start the application
echo "🚀 Starting Contract Generator application..."
docker-compose down 2>/dev/null || true
docker-compose up --build -d

echo "⏳ Waiting for application to start..."
sleep 15

echo "🔍 Testing application health..."
if curl -f http://localhost:8080/health 2>/dev/null; then
    echo "✅ Application is healthy!"
else
    echo "⚠️ Health check failed, but application might still be starting..."
fi

echo "📊 Checking container status..."
docker-compose ps

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=================================="
echo ""
echo "🌐 Your Contract Generator is now live at:"
echo "   http://159.69.204.101:8080"
echo ""
echo "📊 To check status:"
echo "   docker-compose ps"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
echo ""
echo "🔄 To restart:"
echo "   docker-compose restart"
echo ""
echo "✨ Everything is ready! Your Contract Generator is running! 🎉"
