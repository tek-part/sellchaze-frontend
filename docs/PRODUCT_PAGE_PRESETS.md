# Complete product page layouts

The product landing editor provides 22 page layouts under **استيراد قالب**, built from 297 editable section geometries. Layout modules load on demand. A gallery card uses one static frame for the composition, while the full preview uses editable native sections.

Applying a layout either replaces the current document or appends sections. The operation enters the existing undo history and requires an explicit Save to publish. Appending enforces the 60-section limit and retains one checkout. The first two Ramadan layouts appear below the conventional product page; the remaining layouts include one existing shared checkout. Product pricing, variants, quantity, offers and inventory keep using the shared purchase flow.

Below-product preset layouts expose the conventional product's inline checkout without changing stored product preferences. Appending to this mode does not insert a second checkout. A preset section can also switch to its corresponding element-family design, preserving its identity, owned content, media and CSS through Save and undo.

Text, rich content, owned images, gallery ordering, cards, FAQ answers, video, countdown deadlines, colors, backgrounds, motion and full section CSS remain editable. Clicking text, images or cards opens the corresponding editor. CSS may be cleared or restored; preset-specific fields are rejected on other section families. Existing JSON import/export and legacy elements remain supported.

Initial content uses the current product's name, description and images. Actual customer reviews and FAQ answers are left for the merchant. Gallery thumbnails may use neutral labels to demonstrate empty slots; those labels are never saved. Empty unfilled collections are omitted from the public page. Reference product photos, customer identities, testimonials, commercial claims, discounts and scripts are not bundled. Ramadan decoration is original SVG artwork; see its `SOURCE.txt`.

Native FAQ behavior supports a single open answer, keyboard navigation, accessible expanded state and reduced motion. Trusted video placeholders accept only the existing YouTube, Vimeo and MP4 URL rules. The outer frame remains opaque and sandboxed. Raw owner HTML gains no SVG, frame, accordion or carousel privileges; owner fragments are sanitized before composition. Live clocks keep existing session deadlines and use authenticated bounded updates without replacing the frame each second.

The isolated document renders full width; its own CSS controls inner content widths and responsive layouts. Existing storefront header/footer identity stays with the selected theme. Source template geometry was inspected, but complete pixel, typography-resource, animation-frame and all source-phone parity are not asserted. Broader theme/funnel, notification, sidebar and feature parity remains active. Production publication requires the paired backend first and a successful server access preflight.
