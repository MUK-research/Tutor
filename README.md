# Tutor

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

Practice, listening, and the demo enter focus view automatically, keeping all controls at the top while hiding history and help. Stopping restores the previous view. Focus can also be toggled manually. Score zoom ranges from 20% to 300% of the panel width; Fit page shows the entire portrait sheet. Zoomed pages can be scrolled. Narrow screens stack the score and graph vertically. Session summaries appear below the cube. Up to 50 sessions, including raw matched-note deviations and sampled traces, are saved locally; the history shows the latest 30. Local files remain on this browser and do not sync between devices. Browser data clearing removes them. Storage failures are reported instead of claiming a successful save.

## The cube

The centre of all three ranges is an exact reference match. Cube edges indicate ±32 MIDI velocity units, ±250 ms onset error, and ±100% reference key-hold duration error; values outside the range are clamped visually.

| Axis | Negative end | Centre | Positive end |
| --- | --- | --- | --- |
| Green, vertical | Softer | Reference velocity | Louder |
| Red, right | Early | Reference onset | Late |
| Blue, left | Shorter | Reference key-hold duration | Longer |

The projection preserves the supplied three-axis orientation and draws the full cube. A 200 ms exponential interpolation smooths displayed movement, and the trailing 6.5 seconds fade away. Reduced-motion preferences remove positional interpolation. Onset and velocity update at note-on; duration becomes available at note-off. Until the next release, the duration axis holds the last measured duration error. This represents recent note events, not a continuous measurement of a still-held note. There is no pedal-duration scoring.

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

`npm test` covers the sample MIDI, tempo changes across tracks, running status, malformed files, chord matching, repeated notes, channel-specific releases, tempo scaling, axis signs, and missed/extra/unreleased-note penalties. Library tests cover folder links without metadata or catalog entries, optional scores, custom filenames, invalid paths, missing MIDI, and all bundled lessons. Syntax and local asset references are also checked during implementation. Real MIDI hardware and browser visual testing are still needed with the intended piano.

Browser and hosting references: [Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
