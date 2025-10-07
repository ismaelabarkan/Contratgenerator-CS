# 🚀 Contract Generator - Quick Reference

## 🔑 **VPS Gegevens**
- **IP:** `159.69.204.101`
- **User:** `root`
- **SSH Key:** `~/.ssh/id_ed25519_vps`
- **URL:** `http://159.69.204.101:8080`

## ⚡ **Snelle Commands**

### **Deploy (Volledig Automatisch):**
```bash
scp -i ~/.ssh/id_ed25519_vps complete-deployment.sh root@159.69.204.101:/root/
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "chmod +x /root/complete-deployment.sh && /root/complete-deployment.sh"
```

### **Alleen HTML Update:**
```bash
scp -i ~/.ssh/id_ed25519_vps standalone_contract_generator.html root@159.69.204.101:/root/contract-generator/
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose restart"
```

### **Status Check:**
```bash
curl http://159.69.204.101:8080/health
```

### **Logs Bekijken:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose logs -f"
```

### **Restart:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose restart"
```

## 🔧 **Troubleshooting**

### **SSH Test:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "echo 'SSH works'"
```

### **Container Status:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose ps"
```

### **Stop Alles:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose down"
```

## 📁 **Belangrijke Bestanden**
- `complete-deployment.sh` - Volledig deployment script
- `standalone_contract_generator.html` - Je applicatie
- `~/.ssh/id_ed25519_vps` - SSH private key
- `DEPLOYMENT-GUIDE.md` - Volledige documentatie

**🎯 Bewaar deze referentie voor snelle toegang!**
