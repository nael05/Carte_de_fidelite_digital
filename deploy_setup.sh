#!/bin/bash
# deploy_setup.sh — installation de Fidelyz sur un serveur Ubuntu 22.04/24.04 (Nginx + Node 20 + MySQL + PM2)
# Usage : DOMAIN=fidelyzapp.fr EMAIL_ADMIN=vous@exemple.fr bash deploy_setup.sh
# Le fichier backend/.env doit être rempli APRÈS ce script (modèle : backend/.env.production.example).

set -euo pipefail

DOMAIN="${DOMAIN:-fidelyzapp.fr}"
EMAIL_ADMIN="${EMAIL_ADMIN:?Indiquez EMAIL_ADMIN (adresse pour Let's Encrypt)}"
APP_DIR="/var/www/fidelyz"
REPO="https://github.com/nael05/Carte_de_fidelite_digital.git"

echo "🚀 Installation de Fidelyz pour ${DOMAIN}…"

sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx mysql-server

# Node.js 20 LTS + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

sudo systemctl enable --now mysql

# Code
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  sudo git clone "$REPO" "$APP_DIR"
fi
sudo chown -R "$USER:$USER" "$APP_DIR"

# Dépendances et build
(cd "$APP_DIR/backend" && npm ci --omit=dev)
(cd "$APP_DIR/frontend" && npm ci && npm run build)
mkdir -p "$APP_DIR/backend/uploads" "$APP_DIR/backend/logs" "$APP_DIR/backend/certs"
chmod 700 "$APP_DIR/backend/certs"

# Nginx : site statique + API + images téléversées
sudo tee /etc/nginx/sites-available/fidelyz > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 12m;   # logos et bannières (10 Mo max côté API)
    server_tokens off;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(self), geolocation=(), microphone=()" always;

    root ${APP_DIR}/frontend/dist;
    index index.html;

    # Fichiers de build versionnés : cache long
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location / {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$remote_addr;   # écrase toute valeur envoyée par le client
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    # Images téléversées : uniquement des images, jamais interprétées
    location ~ ^/uploads/[A-Za-z0-9._-]+\.(png|jpe?g|webp)$ {
        root ${APP_DIR}/backend;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Content-Security-Policy "default-src 'none'" always;
        expires 7d;
    }
    location /uploads/ { return 404; }
}
EOF
sudo ln -sf /etc/nginx/sites-available/fidelyz /etc/nginx/sites-enabled/fidelyz
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# HTTPS (obligatoire : Apple Wallet n'appelle que des URL https)
sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL_ADMIN" --redirect

cat <<NEXT

✅ Serveur prêt. Étapes suivantes :
  1. Base de données :
       sudo mysql -e "CREATE DATABASE fidelyz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
                      CREATE USER 'fidelyz'@'localhost' IDENTIFIED BY '<mot de passe fort>';
                      GRANT ALL ON fidelyz.* TO 'fidelyz'@'localhost';"
  2. Configuration : cp $APP_DIR/backend/.env.production.example $APP_DIR/backend/.env  puis la remplir
     (certificats Apple/Google dans $APP_DIR/backend/certs/).
  3. Schéma et compte admin :
       cd $APP_DIR/backend && node scripts/run_migration.js schema.sql && node scripts/init-admin.mjs
  4. Démarrage : cd $APP_DIR/backend && pm2 start server.js --name fidelyz && pm2 save && pm2 startup
  5. Vérification : curl https://${DOMAIN}/api/wallet/health
NEXT
