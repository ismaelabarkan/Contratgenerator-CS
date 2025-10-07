# 🎯 CONTRACT GENERATOR - MASTER INDEX

## ✨ **OPGERUIMDE VERSIE - Van 25+ bestanden naar 5 essentiële bestanden!**

## 📍 **WAAR VIND IK WAT?**

### 🔑 **BELANGRIJKSTE BESTANDEN (BEWAAR DIT BESTAND!)**

#### **📖 Documentatie:**
- **`QUICK-REFERENCE.md`** ← **SNELLE COMMANDS** (voor dagelijks gebruik)
- **`README-MASTER.md`** ← **DIT BESTAND** (master index)

#### **🔐 SSH & VPS Gegevens:**
- **`ssh-backup-20251006-123019/`** ← **COMPLETE BACKUP** (SSH keys + alles)
- **`ssh-backup-20251006-123019/BACKUP-INFO.txt`** ← **VPS gegevens**

#### **🚀 Deployment:**
- **`complete-deployment.sh`** ← **DEPLOYMENT SCRIPT** (doet alles automatisch)
- **`standalone_contract_generator.html`** ← **JE APPLICATIE**

## 🎯 **SNELLE TOEGANG**

### **Voor Toekomstige Deployments:**
1. **Open:** `QUICK-REFERENCE.md` (snelle commands)
2. **Voor details:** `README-MASTER.md` (dit bestand - volledige uitleg)

### **Als je alles kwijt bent:**
1. **Ga naar:** `ssh-backup-20251006-123019/`
2. **Voer uit:** `./restore.sh`
3. **Lees:** `BACKUP-INFO.txt` voor VPS gegevens

## 🔑 **VPS GEGEVENS (SNEL REFERENTIE)**

```
VPS IP: 159.69.204.101
User: root
SSH Key: ~/.ssh/id_ed25519_vps
URL: http://159.69.204.101:8080
```

## ⚡ **MEEST GEBRUIKTE COMMANDS**

### **Deploy (Volledig):**
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

## 📁 **BESTANDEN OVERZICHT (OPGERUIMD)**

### **🎯 ESSENTIEEL (Bewaar deze!):**
- ✅ `README-MASTER.md` ← **DIT BESTAND** (master index)
- ✅ `QUICK-REFERENCE.md` ← Snelle commands
- ✅ `ssh-backup-20251006-123019/` ← Complete backup
- ✅ `complete-deployment.sh` ← Deployment script
- ✅ `standalone_contract_generator.html` ← Je applicatie

### **🧹 OPGERUIMD (Verwijderd):**
- ❌ `DEPLOYMENT-GUIDE.md` ← Verwijderd (te uitgebreid)
- ❌ `backup-ssh-keys.sh` ← Verwijderd (al gedaan)
- ❌ `Dockerfile` ← Verwijderd (in deployment script)
- ❌ `docker-compose.yml` ← Verwijderd (in deployment script)
- ❌ `nginx.conf` ← Verwijderd (in deployment script)
- ❌ `README.md` ← Verwijderd (duplicate)
- ❌ `SETUP.md` ← Verwijderd (duplicate)
- ❌ `DEPLOYMENT-INSTRUCTIONS.md` ← Verwijderd (duplicate)
- ❌ 15+ andere oude bestanden ← Verwijderd

## 🚨 **IN CASE OF EMERGENCY**

### **Als je alles kwijt bent:**
1. **Ga naar backup folder:** `ssh-backup-20251006-123019/`
2. **Lees:** `BACKUP-INFO.txt`
3. **Voer uit:** `./restore.sh`
4. **Test:** `ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "echo test"`

### **Als SSH niet werkt:**
1. **Gebruik VPS Console** (web interface)
2. **Check:** `ssh-backup-20251006-123019/BACKUP-INFO.txt` voor SSH key
3. **Voeg SSH key toe** via VPS console

### **Als applicatie niet werkt:**
1. **Check status:** `curl http://159.69.204.101:8080/health`
2. **Check logs:** `ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose logs"`
3. **Restart:** `ssh -i ~/.ssh/id_ed25519_vps root@159.69.204.101 "cd /root/contract-generator && docker-compose restart"`

## 📍 **WAAR STAAT WAT?**

### **Op je Mac (lokaal) - OPGERUIMD:**
```
/Users/gstevens/Projects/ContractGenerator/
├── README-MASTER.md ← DIT BESTAND (start hier!)
├── QUICK-REFERENCE.md ← Snelle commands
├── ssh-backup-20251006-123019/ ← Complete backup
├── complete-deployment.sh ← Deployment script
└── standalone_contract_generator.html ← Je applicatie
```

### **Op je VPS:**
```
/root/contract-generator/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── standalone_contract_generator.html
└── complete-deployment.sh
```

## 🎯 **WORKFLOW VOOR TOEKOMSTIGE DEPLOYMENTS**

### **Stap 1: Open dit bestand**
- **Lees:** `README-MASTER.md` (dit bestand)

### **Stap 2: Kies je aanpak**
- **Snelle update:** `QUICK-REFERENCE.md`
- **Volledige deployment:** `README-MASTER.md` (dit bestand)

### **Stap 3: Voer uit**
- **Kopieer commands** uit de gids
- **Voer uit** in terminal

## 🔒 **SECURITY NOTES**

### **SSH Key Locatie:**
- **Private key:** `~/.ssh/id_ed25519_vps`
- **Backup:** `ssh-backup-20251006-123019/id_ed25519_vps`

### **Belangrijk:**
- **Deel nooit je private key**
- **Bewaar backup veilig**
- **Test SSH regelmatig**

---

## 🎉 **SAMENVATTING**

**Dit bestand (`README-MASTER.md`) is je startpunt voor alles!**

**Bewaar dit bestand en je weet altijd waar je alles kunt vinden!**

**Voor snelle toegang:**
1. **Open dit bestand** (`README-MASTER.md`)
2. **Ga naar** `QUICK-REFERENCE.md` voor commands
3. **Lees dit bestand** voor volledige details

**🚀 Je bent nu volledig georganiseerd!**
