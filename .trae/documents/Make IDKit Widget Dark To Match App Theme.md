## Overview

We will make the World ID (IDKit) widget visually match your app’s dark, black/gray + orange theme. IDKit doesn’t expose a public theme API like ConnectKit; it generally follows the app’s styling. If it renders light in your setup, we’ll apply safe CSS overrides to its modal elements.

## Steps

1. Verify Current Appearance

* Run the frontend and open the IDKit modal in VaultCreation

* Confirm whether the modal renders dark by default in your environment

1. Apply Dark Styling (If Needed)

* Add scoped CSS overrides in `apps/frontend/src/index.css` targeting IDKit modal classes (container, overlay, content, buttons)

* Use colors consistent with your app: black/near-black backgrounds, gray text, orange borders/shadows

1. Wire Overrides

* Ensure the overrides are loaded app-wide (they will apply only when IDKit modal is present)

* Keep styles minimal and non-intrusive

1. Validate UX

* Open the widget and confirm: dark background, readable gray text, visible orange edges and glow

* Check hover/focus states remain accessible

## Implementation Details

* CSS example (to be adjusted to the actual IDKit DOM classes after a quick inspect):

```
/* IDKit modal container */
.idkit-modal { background: rgba(10,10,10,0.96); color: #e5e7eb; border: 1px solid rgba(249,115,22,0.35); border-radius: 16px; box-shadow: 0 0 45px rgba(249,115,22,0.6); }
.idkit-overlay { background: rgba(0,0,0,0.7); }
.idkit-button-primary { background: #0f0f0f; color: #fff; }
.idkit-button-primary:hover { background: #141414; }
.idkit-button-danger { background: #f97316; color: #0a0a0a; }
.idkit-button-danger:hover { background: #fb923c; }
```

* If actual class names differ, we’ll map to the correct selectors by inspecting the modal in DevTools and prefer attribute-based selectors to avoid brittleness.

## Result

* The World

