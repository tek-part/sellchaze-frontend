# Product countdown layouts

The product landing editor supports 33 explicit countdown variants. Each has a native gallery preview with measured proportions, four live time units, independent heading/description editing, owned background media, colors, duration, optional UTC deadline, motion controls and full custom CSS clear/restore.

Session deadlines reuse the existing product/section/duration key. Changing layout or text does not restart the clock. Expired deadlines remain at zero; changing duration creates the corresponding duration key. Gallery thumbnails do not read/write session storage or start intervals. Existing countdown sections retain their legacy rendering until a layout is selected, keeping their duration and content.

CSS runs inside the existing opaque sandbox. Native countdowns send bounded clock values using the frame nonce and parent/source guards; ticking does not rebuild the frame document. Raw owner HTML cannot enable this bridge or native text editing. Owner HTML/CSS bounds and CSP remain unchanged. Generated extra content is retained, and purchase actions use the existing shared checkout.

The decorative gallery background is an original neutral SVG. No reference product photographs or marketing claims are distributed. The catalogue of 321 element designs is separate from product-page presets, themes, funnels and remaining merchant features; broader parity and production deployment are still incomplete.

Validation: 793 frontend tests across 135 files, lint/strict lint, TypeScript and production budgets. Local browser checks include 33 layouts, 390/320px public pages, 366px gallery and 300px text popover, plus title/design/CSS/legacy Save and exact undo on an isolated synthetic product. Computed numeric typography, spacing, colors, corners and shadows match sampled reference properties; complete pixel/hover/source-phone equivalence is unproven.
