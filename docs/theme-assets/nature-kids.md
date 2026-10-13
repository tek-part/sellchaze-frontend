# Nature Kids assets and review scope

The four PNG campaigns under `public/media/theme-campaigns/nature-kids-*-v1.png` are original synthetic photographs produced with built-in `image_gen`. Desktop campaigns use 16:9; their portrait edits use 2:3. No competitor campaign photographs, brand marks or product photographs were copied. Exact generation and edit prompts are saved in `nature-kids-image-prompts.json` beside this document.

The package has its own header, footer, cart drawer and twelve home sections, plus category and product rendering. Reference observations were made on the public Nature Kids storefront: DM Sans, Manrope newsletter, blue header controls, a centered slideshow with adjacent peeks, category introduction, colored photo stories, clothing rails, linked looks, toy shelves, promotions, social photography, newsletter, product policy accordions and a sticky purchase bar. Merchant content, policies, stock, variants and linked products remain store-scoped.

Category sorting uses the public API before pagination. Only isolated preview fixtures use local sorting. Customer review submission uses the existing authenticated review endpoint; the public reference's Share Your Review button did not expose a working form during inspection, so this form is a functional Sellchaze implementation rather than an asserted pixel match.

This is one independently implemented theme package. It does not complete the full competitor inventory of themes or funnels, and further footer, gallery, listing and related-product visual comparison remains. GitHub quality checks do not establish a production deployment.
