# Resend Email Setup

The app uses Resend (resend.com) for transactional emails (password reset links,
access invitations). Free tier: 3,000 emails/month, 100/day.

## 1. Create account

Go to https://resend.com/signup and create a free account.

## 2. Add and verify your domain

1. Go to https://resend.com/domains
2. Click "Add domain", enter `refugiodelsatiro.es`
3. Resend will show the SPF, DKIM, and bounce-domain records that it needs.
4. Add the exact records in the DNS provider for `refugiodelsatiro.es`. Keep
   the existing Google site-verification record and any unrelated DNS records.
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

Deploy the pinned production release rather than restarting the stack manually.
See the release instructions in the [README](../README.md#releases-and-deployment).
The production `.env` must also set:

```bash
REFUGIO_BASE_URL=https://refugiodelsatiro.es/ludoteca
REFUGIO_SECURE_AUTH_COOKIE=true
```

## 5. Test

After the production apex has passed its browser smoke tests, send one reset
message to Miquel at the final URL:

`https://refugiodelsatiro.es/ludoteca/forgot-password`

Check the Resend event for that message: SPF and DKIM must pass and DMARC must
align. Do not send any member mail until Miquel gives separate confirmation.
