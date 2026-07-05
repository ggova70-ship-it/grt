/* ===================================================================
   CONFIG — edit these values only.
   Leave FIREBASE_CONFIG blank to run in LOCAL DEMO mode
   (data saved only on this device). See README.md.
=================================================================== */

// 1) Paste your Firebase web-app config here (README step 3-4)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAS7NqqNVCkGvx46fNdwimfPB_2SxqgW80",
  authDomain: "grt-vmhs-07.firebaseapp.com",
  projectId: "grt-vmhs-07",
  storageBucket: "grt-vmhs-07.firebasestorage.app",
  messagingSenderId: "737525237691",
  appId: "1:737525237691:web:2aa00712c97528857d269e",
  measurementId: "G-FT0NL8TSER"
};

// 2) Admin login (top-right button)
//    With Firebase configured, login uses a real Firebase Auth account.
//    You type the username below + the password you set in Firebase Console;
//    behind the scenes it signs in as ADMIN.email.
//    (In local demo mode it just checks user/pass directly.)
const ADMIN = {
  user:  "Messi",                 // what you type in the username box
  email: "admin@grtvmhs.app",     // the Firebase Auth account to create (Console → Authentication)
  pass:  "Fifa2026"               // used ONLY in local demo mode; real password is set in Console
};

// 3) Event date/time (IST) — these are just the DEFAULTS.
//    The logged-in admin can change the date/start/end live in the app
//    (Home tab), and the new values are saved to Firebase for everyone.
const EVENT_DATE_STR  = "2026-08-09"; // YYYY-MM-DD
const EVENT_START_STR = "09:00";      // HH:MM (24-hour)
const EVENT_END_STR   = "21:00";      // HH:MM (24-hour)
const EVENT_START = new Date(`${EVENT_DATE_STR}T${EVENT_START_STR}:00+05:30`);
const EVENT_END   = new Date(`${EVENT_DATE_STR}T${EVENT_END_STR}:00+05:30`);

// 4) Auto-logout the admin after this many minutes of inactivity
const IDLE_MINUTES = 2;