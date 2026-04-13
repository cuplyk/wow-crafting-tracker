# ⚔️ WoW Crafting Tracker

A full web app to track World of Warcraft item crafting profitability. Add items and reagents, see profit/loss, margin %, AH price reference, and expensive reagent analysis — all saved in your browser automatically.

## Features

- **Item Tracker** — add/edit/delete items and reagents inline. Click to expand, click any value to edit.
- **Summary** — all items ranked by profit with totals
- **AH Price List** — all reagents aggregated, sorted by price
- **Expensive Reagents** — cost driver analysis with price bars
- Data saved in **localStorage** — no backend, no account needed
- Export JSON backup from the footer

## Deploy to Vercel (easiest)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com), click **Add New Project**
3. Import your GitHub repo
4. Vercel auto-detects Vite — just click **Deploy**
5. Done! Your app is live at `your-project.vercel.app`

## Deploy to GitHub Pages

```bash
npm install
npm run build
# Then push the dist/ folder to your gh-pages branch
# Or use the gh-pages package:
npx gh-pages -d dist
```

Add to `vite.config.js` if deploying to a subfolder:
```js
export default defineConfig({
  base: '/your-repo-name/',
  ...
})
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Tech stack

- **React 18** + **Vite**
- **lucide-react** for icons
- Zero backend — localStorage for persistence
- Deployable anywhere static files are served
