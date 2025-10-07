# 🚀 Contract Generator - Complete Deployment Guide

## 📋 **Overzicht**
Deze guide bevat alle stappen om je Contract Generator op je VPS te deployen. **Bewaar deze guide goed!**

## 🔑 **VPS Gegevens (BELANGRIJK - BEWAAR DIT!)**

### **VPS Details:**
- **IP Adres:** `159.69.204.101`
- **Gebruiker:** `root`
- **Wachtwoord:** `bhnPVdKmuWLm`
- **SSH Poort:** `22`

### **SSH Key Details:**
- **Private Key:** `~/.ssh/id_ed25519_vps`
- **Public Key:** `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBgDfKxL8AvAoEDiW8iE/PP2N8IxWt9URNJeHvR3KS/L gstevens@MacBook-Pro-van-MacBookPro-M4-GST.local`

## 🛠️ **SSH Setup (Eenmalig)**

### **Stap 1: SSH Key Toevoegen aan VPS**
```bash
# Via VPS Console (web interface):
mkdir -p /root/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBgDfKxL8AvAoEDiW8iE/PP2N8IxWt9URNJeHvR3KS/L gstevens@MacBook-Pro-van-MacBookPro-M4-GST.local" > /root/.ssh/authorized_keys
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
```

### **Stap 2: SSH Configuratie Controleren**
```bash
# Op VPS, zorg dat deze regels in /etc/ssh/sshd_config staan:
PermitRootLogin yes
PasswordAuthentication yes
PubkeyAuthentication yes

# Restart SSH:
systemctl restart ssh
```

### **Stap 3: Test SSH Verbinding**
```bash
# Lokaal (op je Mac):
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "echo 'SSH works!'"
```

## 🚀 **Deployment Process (Voor Toekomstige Updates)**

### **Methode 1: Volledig Automatisch (Aanbevolen)**
```bash
# 1. Upload deployment script
scp -i ~/.ssh/id_ed25519_vps complete-deployment.sh root@159.69.204.101:/root/

# 2. Voer deployment uit
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "chmod +x /root/complete-deployment.sh && /root/complete-deployment.sh"
```

### **Methode 2: Handmatig (Als je wijzigingen wilt maken)**
```bash
# 1. SSH naar VPS
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101

# 2. Ga naar project directory
cd /root/contract-generator

# 3. Stop huidige container
docker-compose down

# 4. Upload nieuwe HTML file
# (Vanaf je lokale machine:)
scp -i ~/.ssh/id_ed25519_vps standalone_contract_generator.html root@159.69.204.101:/root/contract-generator/

# 5. Start opnieuw
docker-compose up --build -d
```

## 📁 **Project Structuur op VPS**
```
/root/contract-generator/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── standalone_contract_generator.html
├── .dockerignore
└── complete-deployment.sh
```

## 🛠️ **Handige Commands**

### **Status Controleren:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose ps"
```

### **Logs Bekijken:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose logs -f"
```

### **Restart Applicatie:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose restart"
```

### **Stop Applicatie:**
```bash
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose down"
```

### **Health Check:**
```bash
curl http://159.69.204.101:8080/health
```

## 🔧 **Troubleshooting**

### **SSH Verbinding Werkt Niet:**
```bash
# Test verbinding
ping 159.69.204.101

# Test SSH
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "echo 'test'"

# Als het niet werkt, check VPS console
```

### **Applicatie Werkt Niet:**
```bash
# Check container status
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose ps"

# Check logs
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose logs"

# Restart container
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose restart"
```

### **Poort 8080 Niet Bereikbaar:**
```bash
# Check firewall
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "ufw status"

# Check of poort open is
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "netstat -tulpn | grep 8080"
```

## 📝 **Voor Toekomstige Updates**

### **Scenario 1: Alleen HTML File Wijzigen**
```bash
# Upload nieuwe HTML file
scp -i ~/.ssh/id_ed25519_vps standalone_contract_generator.html root@159.69.204.101:/root/contract-generator/

# Restart container
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose restart"
```

### **Scenario 2: Volledige Herinstallatie**
```bash
# Upload en voer deployment script uit
scp -i ~/.ssh/id_ed25519_vps complete-deployment.sh root@159.69.204.101:/root/
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "chmod +x /root/complete-deployment.sh && /root/complete-deployment.sh"
```

### **Scenario 3: Nieuwe VPS**
1. **Kopieer SSH key** naar nieuwe VPS
2. **Upload deployment script**
3. **Voer deployment uit**

## 🔒 **Security Notes**

### **SSH Key Beveiliging:**
- **Bewaar je private key veilig:** `~/.ssh/id_ed25519_vps`
- **Deel nooit je private key**
- **Backup je SSH keys**

### **VPS Beveiliging:**
- **Wijzig standaard wachtwoord** na eerste login
- **Update system regelmatig:** `apt update && apt upgrade`
- **Configureer firewall** indien nodig

## 📞 **Support & Backup**

### **Belangrijke Bestanden om te Bewaren:**
- ✅ **Deze guide** (`DEPLOYMENT-GUIDE.md`)
- ✅ **SSH private key** (`~/.ssh/id_ed25519_vps`)
- ✅ **Deployment script** (`complete-deployment.sh`)
- ✅ **HTML applicatie** (`standalone_contract_generator.html`)

### **In Case of Emergency:**
1. **VPS Console** (web interface) voor directe toegang
2. **SSH key backup** op veilige locatie
3. **Deployment script** voor snelle herinstallatie

## 🎯 **Quick Reference**

### **Deployment Commands:**
```bash
# Upload en deploy
scp -i ~/.ssh/id_ed25519_vps complete-deployment.sh root@159.69.204.101:/root/
ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "chmod +x /root/complete-deployment.sh && /root/complete-deployment.sh"
```

### **Status Check:**
```bash
curl http://159.69.204.101:8080/health
```

### **Application URL:**
**http://159.69.204.101:8080**

---

## 📋 **Checklist voor Toekomstige Deployments**

- [ ] SSH key werkt (`ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "echo test"`)
- [ ] VPS is bereikbaar (`ping 159.69.204.101`)
- [ ] Deployment script is up-to-date
- [ ] HTML file is klaar voor upload
- [ ] Health check werkt na deployment

**🎉 Met deze guide hoef je nooit meer alles opnieuw uit te zoeken!**
