# Resend Email Setup

The app uses Resend (resend.com) for transactional emails (password reset links,
access invitations). Free tier: 3,000 emails/month, 100/day.

## 1. Create account

Go to https://resend.com/signup and create a free account.

## 2. Add and verify your domain

1. Go to https://resend.com/domains
2. Click "Add domain", enter `miqueladell.com`
3. Resend will show you DNS records to add (SPF + DKIM)
4. Add those records in OVH: https://manager.eu.ovhcloud.com/#/web/domain/miqueladell.com/zone
5. Wait for verification (usually minutes, up to 72 hours)

## 3. Create an API key

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it `refugio-del-satiro` and set permission to "Sending access"
4. Copy the key (starts with `re_`)

## 4. Update production .env

SSH into the server and update the SMTP variables:

```bash
ssh root@45.95.175.19
nano /root/refugio-del-satiro/.env
```

Replace the SMTP lines with:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_YOUR_API_KEY_HERE
SMTP_FROM=prestamos@refugiodelsatiro.es
```

Then restart:

```bash
cd /root/refugio-del-satiro && docker compose down && docker compose up -d
```

## 5. Test

Go to https://refugio.miqueladell.com/forgot-password and enter your email.
You should receive the reset email within seconds.
