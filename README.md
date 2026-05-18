# GradeX — CGPA Calculator 🎓

> Know your numbers. Own your semester. Brag freely.

A stunning, full-featured CGPA calculator built for students using the Quality Points / Credit Hours system.

## 📐 Grading System

| Credit Hours | Total Marks | Max Quality Points |
|---|---|---|
| 1 CH | 20 marks | 4 QP |
| 2 CH | 40 marks | 8 QP |
| 3 CH | 60 marks | 12 QP |
| 4 CH | 80 marks | 16 QP |

**Formula:** `QP = (Marks Obtained ÷ Total Marks) × (Credit Hours × 4)`

**GPA / CGPA** = `Total Quality Points ÷ Total Credit Hours`

| Grade | % Range | GPA Range |
|---|---|---|
| A | 80–100% | 3.2 – 4.0 |
| B | 65–79% | 2.6 – 3.19 |
| C | 50–64% | 2.0 – 2.59 |
| D | 40–49% | 1.6 – 1.99 |
| F | 0–39% | 0.0 |

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option 2: GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo → Deploy ✅

### Option 3: Drag & Drop
1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag the entire `gradex` folder
3. Deploy!

## ✨ Features
- Multi-semester GPA tracking
- Per-subject grade & quality point calculation
- Cumulative CGPA with animated ring display
- Save result as beautiful PNG image
- Persistent data (localStorage)
- QP table reference modal
- Mobile responsive
- No backend needed — 100% static

## 🗂 Files
```
gradex/
├── index.html    ← Main app
├── style.css     ← All styles
├── app.js        ← All logic
├── vercel.json   ← Vercel config
└── package.json  ← Project info
```
