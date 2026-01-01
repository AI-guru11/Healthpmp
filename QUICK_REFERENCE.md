# Health Coach PWA - Quick Reference

## 🚀 Access Your Application

**URL**: http://YOUR_SERVER_IP:8888

Replace `YOUR_SERVER_IP` with your actual server IP address.

## 📋 Essential Commands

### View Application
```bash
# Open in browser
curl http://localhost:8888

# Check status
sudo systemctl status nginx
```

### Rebuild After Changes
```bash
cd /home/ubuntu/health-pwa
npm run build
sudo systemctl reload nginx
```

### View Logs
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Manage Nginx
```bash
# Start
sudo systemctl start nginx

# Stop
sudo systemctl stop nginx

# Restart
sudo systemctl restart nginx

# Check config
sudo nginx -t
```

## 🔧 Configuration Files

- **Nginx Config**: `/etc/nginx/sites-available/health-coach`
- **Environment**: `/home/ubuntu/health-pwa/.env.production`
- **Manifest**: `/home/ubuntu/health-pwa/public/manifest.json`

## 📱 What Was Built

This is a **Progressive Web App (PWA)** with:
- ✅ Offline functionality
- ✅ End-to-end encryption
- ✅ Arabic RTL interface
- ✅ Health metrics calculator
- ✅ Mobile-installable

## 🎯 Key Features

1. **Metabolic Calculator** - Calculates BMR/TDEE based on user profile
2. **Encrypted Storage** - All data encrypted with AES-256
3. **Offline First** - Works without internet connection
4. **PWA Ready** - Installable on mobile devices

## 🔒 Security

- AES-GCM 256-bit encryption
- PBKDF2 key derivation (100k iterations)
- Content Security Policy headers
- XSS Protection enabled

## 📊 Project Stats

- **Lines of Code**: ~800+
- **Build Size**: 202 KB (precached)
- **Chunks**: 8 optimized chunks
- **Technologies**: React, TypeScript, Vite

## 🎨 Customization

To add your logo/icons:
```bash
# Add your icons (PNG format)
cp your-icon-192.png /home/ubuntu/health-pwa/public/icons/icon-192.png
cp your-icon-512.png /home/ubuntu/health-pwa/public/icons/icon-512.png

# Rebuild
npm run build
sudo systemctl reload nginx
```

## 🌐 Production Deployment

For production with SSL:
```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com

# Update Nginx config server_name
sudo nano /etc/nginx/sites-available/health-coach

# Reload Nginx
sudo systemctl reload nginx
```

## 📞 Support

Full documentation: `/home/ubuntu/health-pwa/DEPLOYMENT_SUMMARY.md`

---
Generated: January 1, 2026
