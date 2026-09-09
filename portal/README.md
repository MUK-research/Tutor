# Tutor · portal presentation

This folder owns Tutor's card on the [Performance Research Lab portal](https://muk-research.github.io/PORTAL/). Edit `metadata.json` for the description, credits, tags and links, `preview.svg` for the schematic thumbnail, and `index.html` for the interactive cube sketch.

Published endpoint: https://muk-research.github.io/Tutor/portal/metadata.json

The central registry contains only an id and this manifest URL. Relative assets resolve beside the JSON. The Pages workflow explicitly includes this directory in `_site/` alongside the unchanged full application. Reloading the portal picks up updates after Tutor's deployment/cache refreshes.

The sketch is not a practice assessment: slider values are illustrative, and its axis projection follows `cube.js`. It requests no MIDI, microphone, sound, storage, tracking or external scripts. It works inside `sandbox="allow-scripts"` and sends `prl:ready`/`prl:resize` with the supplied `prlToken`. It redraws only on input/resize, without an animation loop. The full MIDI app opens outside the iframe.

Description and credits derive from the main README: developed by Adrián Artacho, based on an idea by Jura Margulis. Existing project credits and licences still apply.
