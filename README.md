# GRT 2006–2007 · Vivekananda Municipal High School — Reunion Dashboard

A single-file, mobile-first web dashboard for the GRT reunion of batch **2006–2007**.

- **Event:** Aug 9, 2026 · 9:00 PM onwards (ends same day)
- **Venue:** VMHS School, NG Palle, Madanapalle
- **Admin login (top-right):** `Messi` / `Fifa2026`

## What it does

| Tab | Everyone (view-only) | Admin (logged in) |
|-----|----------------------|-------------------|
| **Home** | Live countdown (days/hrs/min/sec), event details, venue, map link | same |
| **Highlights** | View highlights list | + add / edit / delete highlights |
| **Gallery** | View photos, ❤️ like (max 100/photo), 💬 comment (optional name, max 50/photo), 📥 download | + upload & delete photos, delete comments, **see who commented** |
| **Students** | Filter **All / Boys / Girls** (default All) | + add, ✏️ edit & 🗑 delete students (including the pre-loaded class list) |
| **Events** | View event list | + add / edit / delete events |

Works in **any mobile or desktop browser** — just open the URL. Once hosted on Firebase it runs **24/7** with data shared live across everyone's phones.

## Project structure (one file per tab)

```
grt-dashboard/
├── index.html          small shell: header, bottom nav, shared modals
├── css/styles.css      all styling
└── js/
    ├── config.js       ← EDIT: Firebase keys, admin creds, event date
    ├── core.js         data layer, login, navigation, helpers
    ├── home.js         Home tab (countdown + details)
    ├── highlights.js   Highlights tab (add/edit/delete + view)
    ├── gallery.js      Gallery tab (upload / like / comment)
    ├── students.js     Students tab (+ pre-loaded class list)
    ├── events.js       Events tab
    └── app.js          boots everything
```

Each tab builds its own markup and logic inside its file, so to change a tab you only open that one file.

---

## Run it locally right now (demo mode)
Just double-click `index.html`. It opens in your browser and works fully — but in **local demo mode** data is saved only on that one device. To make data shared & always-on, do the Firebase steps below.

---

## Setup for shared, 24/7 data (Firebase — free)

### 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> → **Add project** → name it (e.g. `grt-2006`). Disable Analytics (optional) → **Create project**.

### 2. Create the database
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Choose a location (e.g. `asia-south1` Mumbai) → start in **Production mode** → Enable.
3. Open the **Rules** tab, paste the contents of **`firestore.rules`** (in this folder) and **Publish**.
   > These rules mean: **anyone can view** everything; **only the signed-in admin can add/delete** photos, students, events and highlights; **viewers may only like/comment** on photos (nothing else). This removes Firebase's "public database" warning.

### 2b. Turn on admin login (Firebase Authentication)
The rules above require a real admin account. Set one up:
1. Left menu → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → enable **Email/Password** → Save.
3. **Users** tab → **Add user**:
   - Email: `admin@grtvmhs.app`  (must match `ADMIN.email` in `js/config.js`)
   - Password: `Fifa2026`  (or your choice — this is the real admin password)
   - **Add user**.
4. In the app, log in by typing username **`Messi`** and that password. (Change the username in `js/config.js` → `ADMIN.user`; change the email/password pair here + in `config.js`.)

### 3. Get your config keys
1. Project **⚙ Settings** → **General** → scroll to **Your apps** → click the **Web `</>`** icon.
2. Register app (any nickname, **don't** enable Hosting checkbox here) → it shows a `firebaseConfig = { ... }` block. Copy those values.

### 4. Paste keys into the app
Open `js/config.js` and fill in this block:
```js
const FIREBASE_CONFIG = {
  apiKey: "....",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "....",
  appId: "...."
};
```
Save. The ⚠️ demo-mode banner disappears and data is now shared & live.

---

## Publish so the URL works 24/7 anywhere

### Option A — Firebase Hosting (recommended, free, custom URL)
Install Node.js first, then in this folder:
```
npm install -g firebase-tools
firebase login
firebase init hosting      # → use existing project, set public dir to ".", single-page app: No, don't overwrite index.html
firebase deploy
```
You get a live URL like `https://grt-2006.web.app` — open it on any phone, share it freely. Always online.

### Option B — Netlify Drop (no install, drag & drop)
Go to <https://app.netlify.com/drop> and drag this folder in. You get an instant public URL.

### Option C — GitHub Pages
Push this folder to a GitHub repo → repo **Settings → Pages → Deploy from branch → main / root**. URL: `https://<user>.github.io/<repo>/`.

---

## Notes
- **Images** are auto-resized in the browser (~1100px, JPEG) and stored in Firestore, so no paid Firebase Storage is needed — stays on the free Spark plan.
- **Photo downloads:** anyone can tap the 📥 button on a gallery photo (thumbnail or full-screen viewer) to save it to their device.
- **Editing students:** the first time an admin logs in, the built-in class list is copied into the database once (tracked by a `settings/studentsSeeded` flag — this works correctly even if you'd already added students before), so every student — including the original 139 — gets an editable/deletable record. After that, Students always loads from the database.
- **Change credentials:** edit `const ADMIN = { user: "Messi", pass: "Fifa2026" }` in `js/config.js`.
- **Comment names:** when commenting, guests can optionally type their name. It's remembered on their device (so they don't retype it each time) and is only shown to the logged-in admin — everyone else just sees the comment text, not who wrote it. Since it's free-text, treat it as a helpful hint rather than a verified identity.
- **Likes:** capped at 100 per photo (comments stay capped at 50), enforced both in the app and in `firestore.rules`.
- **Admin auto-logout:** the admin is automatically logged out after 2 minutes of inactivity (edit `IDLE_MINUTES` in `js/config.js`). This is checked continuously and also re-checked the instant the phone screen/tab wakes up, so it still logs out correctly even if the screen was locked or the app was in the background.
- **Change event date:** edit `EVENT_START` / `EVENT_END` in `js/config.js`.
- Free Firestore limits (50k reads / 20k writes per day) are far above what a reunion needs.