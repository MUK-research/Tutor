# [Tutor](https://muk-research.github.io/Tutor/?lesson=test&fullscreen=1)

A quiet, score-first piano practice space. A zoomable A4-proportioned score page sits on the left, with a large isometric performance cube on the right. All controls, status, and progress stay above both surfaces on a light background. A smooth, fading trace compares MIDI input with a reference lesson. All processing and storage happen in the browser. No server, account, external JavaScript dependency, or MIDI output is needed.

## Open the app

The intended GitHub Pages address is https://muk-research.github.io/Tutor/ once Pages is enabled and deployment succeeds.

In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source. Then run **Actions → Publish Tutor → Run workflow** (or push to main). The workflow runs the comparison tests and publishes only the app and lesson assets.

This repository is private. GitHub Pages for private organization repositories requires a supported paid organization plan. If Pages is unavailable, an organization administrator must decide whether to change the plan, change repository visibility, or use another static host. The repository's visibility is not changed by this project. A Pages website may be publicly visible even when its source repository is private: check the Pages settings before adding private lesson material.

For local development, serve the repository root, for example `python3 -m http.server 8000`, then open `http://localhost:8000`. Do not open index.html using a file URL. Run `npm test` with Node 18+; no npm installation is necessary.

## Practice

1. Select a lesson. The included **First phrase · C major** is an original four-bar, 16-note exercise at 80 BPM, velocity 72, quarter-note key holds. Its MIDI file and score agree.
2. Connect a MIDI-capable piano to the computer. Use desktop Chrome or Edge (or another browser supporting Web MIDI), click **Connect piano**, grant MIDI permission, and choose its input. Web MIDI requires HTTPS or localhost. The app requests no SysEx access.
3. Use **Listen** for a simple synthesized reference, or **Try a demo** to see a simulated performance. Demo results are labelled and are not added to practice history.
4. Press **Start practice**, wait for the four-beat count-in, then play. Optional metronome and tempo scaling are available. Tempo scaling applies equally to reference onsets and durations, including tempo changes in the MIDI file.
5. The session ends 1.5 seconds after the last reference release. Stop saves a partial session, clearly marked. Leaving the tab or losing the selected input stops the session to avoid unreliable background timing.

The focus layout is now the only layout. All controls stay above the practice surfaces. **Full screen** expands the page; **Exit full screen** returns to the browser and clears the saved full-screen preference. Escape exits for this visit while retaining the preference for the next lesson. History and help remain collapsed below the practice area.

Add `&fullscreen=1` to a lesson link, for example https://muk-research.github.io/Tutor/?lesson=test&fullscreen=1 . `fullscreen=true` and a bare `fullscreen` parameter also enable the request; `fullscreen=0` overrides a saved preference for this visit. A successful full-screen entry is remembered in this browser. Fullscreen APIs require a user gesture, so a requested or remembered full-screen mode is entered on the first eligible click (such as Start or clicking the score), not unconditionally on page load. MIDI connection, file selection, and Copy link retain their own browser activation. Unsupported or denied full-screen requests show a message and leave practice usable. Copy lesson link includes the full-screen request when enabled.

The subtle progress indicator spans only the score panel, with elapsed and total time below it; it does not form a divider across the graph.

Score zoom ranges from 20% to 300% of the panel width; Fit page shows the entire portrait sheet. Zoomed pages can be scrolled. Narrow screens stack the score and graph vertically. Session summaries appear below the cube. Up to 50 sessions, including raw matched-note deviations and sampled traces, are saved locally; the history shows the latest 30. Local files remain on this browser and do not sync between devices. Browser data clearing removes them. Storage failures are reported instead of claiming a successful save.

## The cube

The centre of all three ranges is an exact reference match. Cube edges indicate ±32 MIDI velocity units, ±250 ms onset error, and ±100% reference key-hold duration error; values outside the range are clamped visually.

| Axis | Negative end | Centre | Positive end |
| --- | --- | --- | --- |
| Green, vertical | Softer | Reference velocity | Louder |
| Red, right | Early | Reference onset | Late |
| Blue, left | Longer | Reference key-hold duration | Shorter |

The projection preserves the supplied three-axis orientation and draws the full cube. Duration is visually reversed: shorter key presses travel toward the left/front end; longer key presses toward the opposite end. Raw duration errors and scoring retain their original signs; only the plotted coordinate is reversed. A 200 ms exponential interpolation smooths displayed movement, and the trailing 6.5 seconds fade away. Reduced-motion preferences remove positional interpolation. Onset and velocity update at note-on; duration becomes available at note-off. Until the next release, the duration axis holds the last measured duration error. This represents recent note events, not a continuous measurement of a still-held note. There is no pedal-duration scoring.

## Review a phrase over time

After a practice or demo, **Review the phrase** opens a full-width graph at the bottom of the page. It displays dynamics (green solid), onset timing (red dashed), and key duration (blue dotted) as **per-note accuracy from 0–100%**, using the same credit formulas as the overall results. Measurements are placed at their reference onsets, adjusted for the selected tempo. Lines connect note measurements; they are not continuous acoustic measurements. Notes in a chord are averaged on the line, while the individual values remain available in the detail table. Opposing signed errors never cancel out in the accuracy average.

Hover or click on the graph, or move the keyboard-accessible **Inspect the phrase** slider, to see the corresponding notes, exact signed deviations, and percentages. Missed notes appear as crosses below the chart and receive zero credit. Extra notes appear as triangles at their played times and reduce the overall scores; they have no matching score position. Unreleased notes receive zero duration credit and are explicitly labelled. When practice is stopped, the unplayed future section is shaded and marked as not reached rather than shown as measured data. The existing whole-exercise scores still use the full reference, including that unfinished section.

Three **Show on score** checkboxes independently enable optional annotations on the score. All are off initially, and all can be turned off again. The notation stays readable: small colour marks sit below the noteheads, with 20% fill opacity and size/outline strength increasing with error. The three slots are dynamics, timing, duration from left to right. Clicking a marker selects its corresponding time in the report. Missing notes have a cross; an unreleased duration has a dashed outline. Selecting a time highlights the corresponding mapped notes when overlays are enabled. Score markers scale and move with the fitted image, zoom and scroll.

New practice sessions store the report along with their raw events and have a **Review** button in history. Demos remain unsaved. Old sessions retain their previous summaries. If the original lesson is unavailable or its reference has changed, the saved timeline is still viewable, but its feedback is not placed on a different score.

### Align a score image

An image alone contains no machine-readable link to MIDI times. The bundled examples include note positions, so overlays work immediately. For another score, finish a practice or demo, click **Align score**, and click each reference notehead in order. The note number, pitch and original-reference time identify the next note. Use Previous, Next, or the note-number field to skip or correct positions, then Save alignment. Partial alignment is allowed: only mapped notes receive markers. The alignment is local to this browser and reference; replacing the score image may require realignment.

For a shared lesson, provide `scorePositions` in its `lesson.json`. Each `index` is zero-based in the parsed reference's onset/pitch order; `x` and `y` are normalized positions within the original image (0–1), not screen coordinates. Chord notes have independent indices. For example:

```json
"scorePositions": [
  {"index": 0, "x": 0.2204, "y": 0.2404},
  {"index": 1, "x": 0.4093, "y": 0.2351}
]
```

Invalid positions are ignored. Position metadata does not change the MIDI reference or scoring. There is no optical score recognition or guessed automatic image-to-time alignment.

## Matching and scoring, version 1

Each student note-on matches the nearest unused reference note of the same pitch within ±500 ms. Chord order is independent; repeated pitches are matched by onset proximity. Incoming channels are combined for pitch matching, but held notes and releases are tracked per input channel and pitch. Reference notes are paired per track/channel/pitch. MIDI format 0 and 1, PPQ timing, tempo maps, running status, overlapping notes, and note-on with velocity zero are supported. Format 2 and SMPTE divisions are rejected explicitly. Notes missing a release in the file are omitted with a warning.

This is fixed-clock practice: it does not follow rubato, infer tempo from the student, or re-align an entire performance after the student loses their place. Dense repeated notes or deviations beyond the matching window may be ambiguous. Use a matching tempo and a clean reference MIDI; for multi-part files, export only the part(s) the student should play, without accompaniment or percussion.

For each matched note, the three credits are:

- Dynamics: `max(0, 1 - abs(studentVelocity - referenceVelocity) / 32)`.
- Timing: `max(0, 1 - abs(studentOnset - referenceOnset) / 0.250)` (seconds).
- Duration: `max(0, 1 - abs(studentHeld / referenceHeld - 1))`.

Each percentage is `100 × sum(credits) / (referenceNoteCount + extraNoteCount)`. Missing notes contribute zero. Unreleased notes get zero duration credit. The final numbers use raw events, never smoothed visual positions. These thresholds are transparent starting values for pedagogical discussion, not validated assessment norms. Different piano velocity curves and input latency can affect comparisons; this version has no device calibration.

## Lesson library and shareable links

Open a repository lesson directly with `?lesson=<folder>`:

- [First phrase](https://muk-research.github.io/Tutor/?lesson=test)
- [Even touch](https://muk-research.github.io/Tutor/?lesson=legato)
- [Shaping a phrase](https://muk-research.github.io/Tutor/?lesson=dynamics)

Each lesson lives in a lowercase `library/` directory, with one subfolder per lesson. Folder names are case-sensitive and may contain letters, digits, hyphens, and underscores (start with a letter or digit).

For example, commit `library/test/test.mid` and optionally `library/test/test.png`, then share `?lesson=test`. No metadata is required with this naming convention. The loader also checks `<folder>.svg`, `.jpg`, `.webp`, and `score.svg`, `.png`, `.jpg`, `.webp`. A missing image leaves a clean page placeholder; automatic notation from MIDI is not implemented. Uploaded page images are fitted onto an A4-proportioned sheet without cropping.

An optional `library/test/lesson.json` allows custom filenames and a friendly title:

```json
{
  "title": "First phrase · C major",
  "midi": "reference.mid",
  "image": "score.png"
}
```

Files named in the metadata must be directly inside that lesson folder. Set `"image": null` to explicitly omit a score. The MIDI file remains required. Each lesson's timing and dynamics come from the MIDI, not the image.

The publishing workflow automatically regenerates `library/index.json` from lesson folders using `node tools/index-library.mjs`. This supplies the dropdown list; direct `?lesson=` links also load folders absent from the index. Run the same command after adding folders for local development. An invalid or missing lesson reports an error and leaves available lessons usable. Selecting another repository lesson updates the address bar. **Copy lesson link** copies the URL; browser-imported lessons cannot be shared by URL.

The three included examples use the same original C-major phrase with different reference tempi or velocity shapes, and include portrait scores. The older `lessons/` assets remain for compatibility and parser tests.

## Import a personal lesson

**Add lesson** imports a `.mid` / `.midi` file and an optional PNG, JPEG, WebP, or SVG score image into this browser's IndexedDB. Each lesson retains its name, parsed reference, and score across reloads. Maximum sizes: 5 MB MIDI, 15 MB image, 20,000 notes. Score images are displayed as supplied, without automatic score following or page turning. Use original or appropriately licensed lesson material.

## Verification

`npm test` covers the sample MIDI, tempo changes across tracks, running status, malformed files, chord matching, repeated notes, channel-specific releases, tempo scaling, axis signs, and missed/extra/unreleased-note penalties. Library tests cover folder links without metadata or catalog entries, optional scores, custom filenames, invalid paths, missing MIDI, and all bundled lessons. Report tests cover reference-time placement, per-note credits, chord averaging, extra/missing/unreleased/unreached notes, position validation, image letterboxing/zoom, and reference compatibility for saved reports. Syntax and local asset references are also checked during implementation. Real MIDI hardware and browser visual testing are still needed with the intended piano.

Browser and hosting references: [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Credits

Developed by [Adrián Artacho](https://muk.ac.at/studienangebot/lehrende/details/adrian-artacho.html), researcher at the Music and Arts University of the City of Vienna (MUK).

Based on an idea by [Jura Margulis](https://muk.ac.at/studienangebot/lehrende/details/jura-margulis.html).
