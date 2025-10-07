#!/bin/bash

# Test Contract Generator v3 Flow System lokaal
# Dit script start de applicatie lokaal in Docker voor testing

set -e

echo "🧪 Contract Generator v3 - Lokaal Testen"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is niet actief. Start Docker eerst."
    exit 1
fi

echo "✅ Docker is actief"

# Check if required files exist
echo "🔍 Checking required files..."
required_files=(
    "standalone_contract_generator_v3_flow.html"
    "clausules/"
    "flows/"
    "beheer/"
    "Dockerfile"
    "docker-compose.yml"
)

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        echo "❌ $file niet gevonden!"
        exit 1
    fi
done

echo "✅ Alle benodigde bestanden gevonden"

# Stop any existing containers
echo "🛑 Stoppen van bestaande containers..."
docker-compose down 2>/dev/null || true

# Build and start the application
echo "🔨 Building en starting de applicatie..."
docker-compose up --build -d

echo "⏳ Wachten tot de applicatie start..."
sleep 10

# Test the application
echo "🔍 Testing de applicatie..."
if curl -f http://localhost:8080/health 2>/dev/null; then
    echo "✅ Application is healthy!"
else
    echo "⚠️ Health check failed, maar de applicatie start mogelijk nog..."
fi

# Show container status
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🎉 LOKAAL TESTEN GESTART!"
echo "========================="
echo ""
echo "🌐 Je Contract Generator v3 Flow System is nu lokaal beschikbaar op:"
echo "   http://localhost:8080"
echo ""
echo "🔧 Flow Beheer interface:"
echo "   http://localhost:8080/beheer/flow-beheer.html"
echo ""
echo "📊 Container status bekijken:"
echo "   docker-compose ps"
echo ""
echo "📝 Logs bekijken:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Stoppen:"
echo "   docker-compose down"
echo ""
echo "🔄 Herstarten:"
echo "   docker-compose restart"
echo ""
echo "✨ Je kunt nu lokaal testen! 🎉"
echo ""
echo "💡 Tips voor testing:"
echo "   - Test de flow door verschillende antwoorden te geven"
echo "   - Controleer of de conditionele clausules correct worden getoond"
echo "   - Test de beheerinterface voor flow configuratie"
echo "   - Controleer of alle JSON bestanden correct worden geladen"
