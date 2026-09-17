# Darb Fleet — Ideogram Photo Prompts (image-to-image, using your real car photos as reference)

Since you're uploading a real photo of each car as the reference image, the text prompt's only job is to force the *same background/lighting* on every one — the car itself comes from your photo, not the text. So all 11 cars use the exact same prompt below. Do not vary the text between cars; only the uploaded reference photo changes.

**Workflow in Ideogram:**
1. Upload the real photo of the car (Remix / Reference / Edit feature — whichever Ideogram calls it in your version).
2. Set image influence/strength high enough that the car's shape, color, and badges stay exactly as in the photo (start around 70–80%, raise it if the car starts drifting; lower it slightly if the background isn't overriding correctly).
3. Paste the same prompt text every time.
4. Aspect ratio: 4:3 (matches the fleet card crop). Style: Realistic.

**The one prompt to reuse for all 11 cars:**

> Keep the car exactly as shown in the reference photo — same make, model, color, and badges, unchanged. Replace the background and setting only: place the car on a seamless warm off-white studio backdrop (hex EDE6DA), three-quarter front angle, soft diffused overhead daylight, a subtle warm terracotta rim light along the body edge, a soft gradient shadow beneath the car fading to nothing, minimal editorial automotive catalog photography, sharp focus, no text, no logos overlay, no people, no visible photo studio equipment or reflections.

Run this once per car (11 times total), swapping only the reference photo. Because the text never changes, the backdrop/light/shadow should land consistently across the set — check the first 2–3 side by side before running the rest, and nudge the influence slider if the background isn't overriding fully or the car is drifting from the reference.
