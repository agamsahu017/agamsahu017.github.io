# Kodivo – Company Website

Static site (HTML/CSS/JS, no build step). Open `index.html` in a browser to preview.

## Edit
- Services, industries, founder → `index.html`
- Mentoring / batches → `academy.html`
- AI chatbot demo → `demo.html` + `demo.js`
- SEO landing pages → `lucknow.html`, `delhi-ncr.html`, `website-development.html`, `ai-chatbot-whatsapp-automation.html` (English only)
- Custom domain → run `node tools/set-domain.mjs yourdomain.com` (see the notes inside the script)
- Lead forms (consultation + free session) → `forms.js`, saved by the Worker in `D:\personal\kodivo-visitor-counter`
- Sample client websites → `samples/<name>/index.html` (thumbnails in `assets/samples/`)
- Privacy policy → `privacy.html`
- Hindi translations + language button → `i18n.js` (if you change English text, update the matching key there)
- Colors → top of `style.css` (`:root` variables)
- Photo → replace `assets/agam.jpg` (square photo, plain background works best)

## Deploy free on GitHub Pages
1. Create a new **public** repo on GitHub named `agamsahu017.github.io`
2. Run:
   ```
   git remote add origin https://github.com/agamsahu017/agamsahu017.github.io.git
   git push -u origin main
   ```
3. Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save
4. Live in ~1–2 minutes at **https://agamsahu017.github.io**

Custom domain later: buy domain → Settings → Pages → Custom domain → add DNS records shown there.
