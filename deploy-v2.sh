#!/bin/bash

# Deploy Contract Generator v2 (Modulaire Clausules)
# Dit script uploadt de nieuwe v2 versie naar de VPS

set -e

VPS_IP="159.69.204.101"
VPS_USER="root"
SSH_KEY="~/.ssh/id_ed25519_vps"
PROJECT_DIR="/root/contract-generator"

echo "🚀 Contract Generator v2 - Deployment"
echo "====================================="
echo "VPS: $VPS_IP"
echo ""

# Check if files exist
if [ ! -f "standalone_contract_generator_v2.html" ]; then
    echo "❌ standalone_contract_generator_v2.html niet gevonden!"
    exit 1
fi

if [ ! -d "clausules" ]; then
    echo "❌ clausules directory niet gevonden!"
    exit 1
fi

echo "📁 Uploading v2 HTML file..."
scp -i $SSH_KEY standalone_contract_generator_v2.html $VPS_USER@$VPS_IP:$PROJECT_DIR/

echo "📁 Uploading clausules directory..."
scp -r -i $SSH_KEY clausules/ $VPS_USER@$VPS_IP:$PROJECT_DIR/

echo "🔧 Updating Docker configuration..."
ssh -i $SSH_KEY $VPS_USER@$VPS_IP "cd $PROJECT_DIR && cat > Dockerfile << 'EOF'
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY standalone_contract_generator_v2.html /usr/share/nginx/html/index.html
COPY clausules/ /usr/share/nginx/html/clausules/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD [\"nginx\", \"-g\", \"daemon off;\"]
EOF"

echo "🔄 Rebuilding and restarting container..."
ssh -i $SSH_KEY $VPS_USER@$VPS_IP "cd $PROJECT_DIR && docker-compose down && docker-compose up -d --build"

echo "⏳ Waiting for application to start..."
sleep 10

echo "🔍 Testing application health..."
if curl -s http://$VPS_IP:8080/health | grep -q "healthy"; then
    echo "✅ Application is healthy!"
else
    echo "⚠️ Health check failed, but application might still be starting..."
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo ""
echo "🌐 Your Contract Generator v2 is now live at:"
echo "   http://$VPS_IP:8080"
echo ""
echo "📊 To check status:"
echo "   ssh -i $SSH_KEY $VPS_USER@$VPS_IP 'cd $PROJECT_DIR && docker-compose ps'"
echo ""
echo "📝 To view logs:"
echo "   ssh -i $SSH_KEY $VPS_USER@$VPS_IP 'cd $PROJECT_DIR && docker-compose logs -f'"
echo ""
echo "🛑 To stop:"
echo "   ssh -i $SSH_KEY $VPS_USER@$VPS_IP 'cd $PROJECT_DIR && docker-compose down'"
echo ""
echo "🔄 To restart:"
echo "   ssh -i $SSH_KEY $VPS_USER@$VPS_IP 'cd $PROJECT_DIR && docker-compose restart'"
echo ""
echo "✨ Contract Generator v2 with modulaire clausules is ready! 🎉"


