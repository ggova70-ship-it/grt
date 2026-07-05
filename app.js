/* ===================================================================
   APP BOOT — runs after every tab module has injected its markup.
   Only the Home tab's data (settings/event — a single doc) loads
   immediately (triggered by home.js itself). Gallery/Students/Events/
   Highlights are lazy-loaded the first time a visitor actually opens
   that tab (see ensureTabLoaded() in core.js) — this keeps Firestore
   reads down for visitors who only ever look at Home.
=================================================================== */
refreshAuthUI();   // set login button + admin controls