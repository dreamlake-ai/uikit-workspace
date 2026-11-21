These are real 390×844 Sessions integration screenshots from controlled browser fixtures.

- `before.png`: retained compact tab before rich title content was wired.
- `after.png`: a full touch tap opens the active Claude tab's metadata-only title hint.

The integration test also verifies the one-second dismissal, parent-tab keyboard focus, and Escape while the terminal retains focus. The two screenshots use different controlled session fixtures; they demonstrate the title behavior rather than a pixel-for-pixel comparison. The app separately moves its secondary terminal toolbar into the body header on compact screens. Those app changes are not part of this UIKit API.
