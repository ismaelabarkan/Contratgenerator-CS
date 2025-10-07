#!/bin/bash
echo "🔄 Restoring SSH keys and files..."

# Restore SSH keys
if [ -f id_ed25519_vps ]; then
    cp id_ed25519_vps ~/.ssh/
    chmod 600 ~/.ssh/id_ed25519_vps
    echo "✅ Private key restored"
fi

if [ -f id_ed25519_vps.pub ]; then
    cp id_ed25519_vps.pub ~/.ssh/
    chmod 644 ~/.ssh/id_ed25519_vps.pub
    echo "✅ Public key restored"
fi

# Restore other files
cp complete-deployment.sh . 2>/dev/null && echo "✅ Deployment script restored"
cp standalone_contract_generator.html . 2>/dev/null && echo "✅ HTML application restored"
cp DEPLOYMENT-GUIDE.md . 2>/dev/null && echo "✅ Deployment guide restored"
cp QUICK-REFERENCE.md . 2>/dev/null && echo "✅ Quick reference restored"

echo "🎉 Restore completed!"
echo "Test SSH connection: ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 'echo test'"
