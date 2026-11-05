# cPanel Secure Deployment
1. Build bundle: `npm run build:cpanel` (creates `cpanel-deploy.zip`).
2. Upload & extract `cpanel-deploy.zip` inside `/home/kydigitc/floura.kydigit.com/`.
3. Set Node.js 20.x LTS & startup file `app.cjs` in cPanel **Setup Node.js App**.
4. Run `npm install --omit=dev` inside the app virtualenv.
5. Create isolated DB folder: `mkdir -p /home/kydigitc/floura-data && chmod 700 /home/kydigitc/floura-data`.
6. Add `DB_PATH=/home/kydigitc/floura-data/patisserie.sqlite` in `.env` (stores DB outside webroot).
7. Lock permissions: `chmod 600 .env /home/kydigitc/floura-data/*.sqlite && chmod 755 dist dist/assets`.
8. Force HTTPS: In cPanel **Domains**, toggle **Force HTTPS Redirect** to ON.
9. Click **Restart** in cPanel Node.js App.
