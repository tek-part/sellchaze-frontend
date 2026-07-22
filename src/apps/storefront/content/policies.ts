/**
 * Policy content — production-quality starting documents for the standard ecommerce policy set.
 *
 * IMPORTANT: these are TEMPLATES, not legal advice. Every document carries a visible review notice
 * in the UI (see `PolicyPage`) telling the merchant to have it reviewed and customised before
 * publishing. They are written to be genuinely usable — correct structure, real ecommerce clauses,
 * the placeholders a merchant must fill marked with {{store}} / {{email}} tokens that are
 * substituted at render time — rather than filler.
 *
 * The storefront API has no CMS endpoint. When one lands, `PolicyPage` should prefer merchant
 * content and fall back to these. Nothing here invents an endpoint.
 */

export interface PolicySection {
  heading: string;
  body: ReadonlyArray<string>;
  /** Optional bullet list rendered after the body paragraphs. */
  list?: ReadonlyArray<string>;
}

export interface PolicyDoc {
  slug: string;
  title: string;
  summary: string;
  /** ISO date the template was last revised. Displayed as "last updated". */
  updated: string;
  sections: ReadonlyArray<PolicySection>;
}

import { POLICIES_AR } from './policies.ar';

const UPDATED = '2026-07-01';

export const POLICIES: ReadonlyArray<PolicyDoc> = [
  {
    slug: 'privacy',
    title: 'Privacy policy',
    summary: 'What personal data {{store}} collects, why we collect it, and the choices you have.',
    updated: UPDATED,
    sections: [
      {
        heading: 'What we collect',
        body: [
          'We collect the information you give us when you place an order, create an account, contact support or subscribe to our emails. That typically means your name, delivery and billing address, email address, phone number and order history.',
          'We also collect limited technical information automatically — your IP address, browser type, device type and the pages you view — so we can keep the store secure, diagnose faults and understand which products people are looking for.',
        ],
      },
      {
        heading: 'Payment information',
        body: [
          'We do not store full card numbers. Card details are captured and processed by our payment provider under their own security certification. We receive only a payment reference, the last four digits and the card type, which we keep so we can identify a transaction if you contact us about it.',
        ],
      },
      {
        heading: 'How we use your information',
        body: ['We use the information above to:'],
        list: [
          'process, fulfil and deliver your orders, and handle returns or refunds',
          'send transactional messages — order confirmations, dispatch notices and delivery updates',
          'answer your support enquiries and keep a record of our correspondence',
          'detect and prevent fraud, abuse and security incidents',
          'send marketing email, where you have opted in, until you unsubscribe',
          'meet our legal, tax and accounting obligations',
        ],
      },
      {
        heading: 'Who we share it with',
        body: [
          'We share your data only with the parties we need to in order to run the store: our payment provider, our delivery carriers, our email provider, and our hosting and analytics providers. Each is bound by contract to process the data only on our instructions.',
          'We do not sell your personal data.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'We keep order records for as long as we are legally required to for tax and accounting purposes, and account data for as long as your account is open. If you close your account we delete or anonymise your data except where we must retain it by law.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Depending on where you live, you may have the right to access the personal data we hold about you, correct it, delete it, restrict or object to how we use it, and receive a portable copy. You can also withdraw consent to marketing at any time using the unsubscribe link in any email.',
          'To exercise any of these rights, contact us at {{email}}. We will respond within the period required by the applicable law.',
        ],
      },
      {
        heading: 'Cookies',
        body: [
          'We use cookies and similar technologies as described in our cookie policy. You can control non-essential cookies through the consent controls on this site and through your browser settings.',
        ],
      },
      {
        heading: 'Contact',
        body: [
          'If you have a question or a complaint about how we handle your data, contact {{store}} at {{email}}. If you are not satisfied with our response you may have the right to complain to your local data protection authority.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms & conditions',
    summary: 'The terms on which {{store}} sells to you through this website.',
    updated: UPDATED,
    sections: [
      {
        heading: 'About these terms',
        body: [
          'These terms apply to every order placed through this website. By placing an order you agree to them, so please read them before you buy. We may update these terms from time to time; the version in force is the one published when you place your order.',
        ],
      },
      {
        heading: 'Orders and acceptance',
        body: [
          'Your order is an offer to buy. A contract is formed only when we send you a dispatch confirmation. Until then we may decline or cancel an order — for example if the item is out of stock, if we identify a pricing error, or if we cannot authorise your payment.',
        ],
      },
      {
        heading: 'Pricing and payment',
        body: [
          'Prices are shown in the currency displayed at checkout and include applicable taxes unless stated otherwise. Delivery charges are shown separately before you confirm your order.',
          'If we discover an error in the price of goods you have ordered, we will contact you to ask whether you wish to continue at the correct price or cancel. We will not process the order until you respond.',
        ],
      },
      {
        heading: 'Delivery',
        body: [
          'Delivery times shown at checkout are estimates. Risk in the goods passes to you on delivery. Where delivery is delayed by an event outside our control, we will let you know and will not be liable for that delay.',
        ],
      },
      {
        heading: 'Your right to cancel and return',
        body: [
          'Your statutory cancellation and return rights are set out in our return policy and are not affected by these terms.',
        ],
      },
      {
        heading: 'Product descriptions',
        body: [
          'We take care to describe and picture products accurately. Colours may vary between screens, and packaging may differ from images shown. If a product is materially different from its description, you may return it under our return policy.',
        ],
      },
      {
        heading: 'Accounts',
        body: [
          'You are responsible for keeping your account credentials confidential and for activity carried out under your account. Tell us immediately if you believe your account has been accessed without your authorisation.',
        ],
      },
      {
        heading: 'Our liability',
        body: [
          'We do not exclude or limit our liability where it would be unlawful to do so, including liability for death or personal injury caused by our negligence or for fraud. Subject to that, we are not liable for indirect or consequential loss, and our total liability in respect of an order is limited to the price paid for it.',
        ],
      },
      {
        heading: 'Governing law',
        body: [
          'These terms are governed by the laws of the jurisdiction in which {{store}} is established, and the courts of that jurisdiction have exclusive jurisdiction over any dispute.',
        ],
      },
    ],
  },
  {
    slug: 'returns',
    title: 'Return policy',
    summary: 'How to return an item to {{store}}, and what happens next.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Return window',
        body: [
          'You may return most items within 30 days of delivery for a refund or exchange. The item must be unused, in its original condition, and returned with its packaging and any tags still attached.',
        ],
      },
      {
        heading: 'How to start a return',
        body: [
          'Sign in to your account, open the order and choose the item you would like to return. If you checked out as a guest, contact us at {{email}} with your order number and we will send you return instructions.',
        ],
      },
      {
        heading: 'Items we cannot accept',
        body: ['For hygiene, safety or legal reasons we cannot accept returns of:'],
        list: [
          'personalised or made-to-order items',
          'perishable goods',
          'opened cosmetics, fragrance or personal-care products where the seal is broken',
          'underwear, swimwear or earrings where the hygiene seal has been removed',
          'gift cards and downloadable products',
        ],
      },
      {
        heading: 'Return shipping',
        body: [
          'If the item is faulty, damaged or not what you ordered, we cover the cost of return shipping. If you are returning an item because you have changed your mind, the cost of return shipping is yours unless stated otherwise at checkout.',
          'Please keep your proof of postage until the return has been processed.',
        ],
      },
      {
        heading: 'Exchanges',
        body: [
          'The fastest way to exchange an item is to return the original for a refund and place a new order, so the replacement is not held up while the return is in transit.',
        ],
      },
    ],
  },
  {
    slug: 'refunds',
    title: 'Refund policy',
    summary: 'When {{store}} issues a refund, how it is paid, and how long it takes.',
    updated: UPDATED,
    sections: [
      {
        heading: 'When we refund',
        body: [
          'We refund items returned to us in line with our return policy, and any item that arrives faulty, damaged or incorrect. We also refund the standard delivery charge where you cancel an entire order under your statutory cancellation rights.',
        ],
      },
      {
        heading: 'How refunds are paid',
        body: [
          'Refunds are issued to the original payment method. We cannot refund to a different card or account. If your card has expired or been replaced, your bank will normally still route the refund to the replacement — contact your bank if it does not appear.',
        ],
      },
      {
        heading: 'Timescales',
        body: [
          'We process refunds within 5 business days of receiving and inspecting your return, and we email you when the refund is issued. Your bank or card issuer may take a further 3–10 business days to show the credit on your statement.',
        ],
      },
      {
        heading: 'Partial refunds',
        body: [
          'We may issue a partial refund where an item is returned outside the return window, or is returned in a condition that reflects handling beyond what is necessary to establish its nature and characteristics.',
        ],
      },
      {
        heading: 'Problems with a refund',
        body: [
          'If a refund has not reached you within the timescales above, contact {{email}} with your order number and we will trace it.',
        ],
      },
    ],
  },
  {
    slug: 'shipping',
    title: 'Shipping policy',
    summary: 'Where {{store}} delivers, what it costs, and how long it takes.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Processing time',
        body: [
          'Orders are picked and dispatched within 1–2 business days. Orders placed after the daily cut-off, at weekends or on public holidays are processed on the next business day.',
        ],
      },
      {
        heading: 'Delivery options and cost',
        body: [
          'Available delivery options, their cost and their estimated transit time are shown at checkout once you enter your address, because they depend on the destination and the size of the order.',
        ],
      },
      {
        heading: 'Tracking your order',
        body: [
          'You will receive a dispatch email with tracking details as soon as your parcel leaves us. You can also view the status of any order in your account.',
        ],
      },
      {
        heading: 'International delivery',
        body: [
          'For deliveries outside our home market, import duties and taxes may be charged when the parcel reaches its destination. These are set by the destination country and are payable by you — they are not included in the price at checkout unless stated.',
        ],
      },
      {
        heading: 'Delays, damage and missing parcels',
        body: [
          'If your parcel has not arrived within the estimated window, contact {{email}} with your order number and we will open a query with the carrier. If a parcel arrives damaged, keep the packaging and send us a photograph — it helps us resolve the claim quickly.',
        ],
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie policy',
    summary: 'The cookies {{store}} uses and how to control them.',
    updated: UPDATED,
    sections: [
      {
        heading: 'What cookies are',
        body: [
          'Cookies are small text files stored on your device when you visit a website. They let the site remember your actions and preferences — such as the contents of your cart — between pages and visits.',
        ],
      },
      {
        heading: 'The cookies we use',
        body: ['We group the cookies on this site into three categories:'],
        list: [
          'Strictly necessary — sign-in, cart contents, checkout and security. The site cannot function without these, so they cannot be switched off.',
          'Analytics — how the store is used in aggregate, so we can fix problems and improve navigation.',
          'Marketing — measuring campaign performance and, where you have consented, showing you relevant advertising.',
        ],
      },
      {
        heading: 'Managing cookies',
        body: [
          'You can accept or reject non-essential cookies using the consent controls on this site, and change your choice at any time. You can also block or delete cookies in your browser settings, though blocking strictly necessary cookies will stop parts of the store working.',
        ],
      },
      {
        heading: 'Third-party cookies',
        body: [
          'Some cookies are set by the providers we use for payments, analytics and embedded content. We do not control those cookies; please refer to the relevant provider’s own policy.',
        ],
      },
    ],
  },
  {
    slug: 'warranty',
    title: 'Warranty',
    summary: 'The guarantee {{store}} provides on the products we sell.',
    updated: UPDATED,
    sections: [
      {
        heading: 'What is covered',
        body: [
          'We warrant that the products we sell are free from defects in materials and workmanship under normal use for the warranty period stated on the product page. Where no period is stated, a 12-month warranty applies from the date of delivery.',
        ],
      },
      {
        heading: 'What is not covered',
        body: ['The warranty does not cover:'],
        list: [
          'normal wear and tear, including fading, patina and softening of materials',
          'damage caused by accident, misuse, neglect or unauthorised repair',
          'damage caused by failure to follow the care instructions supplied',
          'consumable parts with a defined service life',
          'items sold as seconds, ex-display or clearance where the fault was disclosed',
        ],
      },
      {
        heading: 'Making a claim',
        body: [
          'Contact {{email}} with your order number, a description of the fault and photographs. We will assess the claim and, where it is covered, repair the item, replace it, or refund it at our option.',
        ],
      },
      {
        heading: 'Your statutory rights',
        body: [
          'This warranty is offered in addition to, and does not affect, your statutory rights in relation to goods that are faulty or not as described.',
        ],
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility statement',
    summary: 'How {{store}} works to keep this site usable for everyone.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Our commitment',
        body: [
          'We want everyone to be able to browse and buy from this store, regardless of how they access the web. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.',
        ],
      },
      {
        heading: 'What we do',
        body: ['Across the store we work to ensure that:'],
        list: [
          'every interactive control is reachable and operable with a keyboard alone',
          'a visible focus indicator is always present',
          'text and interface elements meet AA contrast ratios in both light and dark themes',
          'images carry meaningful alternative text',
          'motion respects the reduced-motion setting on your device',
          'forms have associated labels and errors are announced, not only coloured',
        ],
      },
      {
        heading: 'Known limitations',
        body: [
          'Some third-party content embedded in the store — payment forms and certain media players — is outside our direct control, and its accessibility may differ from the rest of the site.',
        ],
      },
      {
        heading: 'Tell us about a problem',
        body: [
          'If you meet a barrier anywhere on this site, please tell us at {{email}}. Describe the page and what happened, and we will respond and work to fix it.',
        ],
      },
    ],
  },
  {
    slug: 'sustainability',
    title: 'Sustainability',
    summary: 'How {{store}} approaches materials, packaging and longevity.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Made to last',
        body: [
          'The most sustainable product is one that does not need replacing. We favour durable materials and repairable construction, and we publish care instructions so that what you buy stays in use for longer.',
        ],
      },
      {
        heading: 'Materials',
        body: [
          'We are working to increase the proportion of certified, recycled and lower-impact materials across the range, and to disclose composition clearly on every product page so you can make an informed choice.',
        ],
      },
      {
        heading: 'Packaging',
        body: [
          'We ship in recyclable packaging, size boxes to their contents to reduce void fill and transport emissions, and avoid single-use plastic wherever an alternative exists.',
        ],
      },
      {
        heading: 'Being honest about it',
        body: [
          'We publish what we have actually changed rather than targets alone. Where we are not yet where we want to be, we would rather say so than overstate it.',
        ],
      },
    ],
  },
];

/**
 * Policy lookup by locale.
 *
 * Both languages use the SAME slugs, so `/pages/privacy` resolves in either language and the page
 * needs no per-language branching or duplicate routes. An Arabic document that has not been written
 * yet falls back to English rather than 404-ing — a policy the customer can read in the wrong
 * language beats a policy they cannot read at all.
 */
const BY_SLUG_EN = new Map(POLICIES.map((p) => [p.slug, p]));
const BY_SLUG_AR = new Map(POLICIES_AR.map((p) => [p.slug, p]));

export function getPolicy(slug: string, locale: string = 'en'): PolicyDoc | undefined {
  if (locale === 'ar') return BY_SLUG_AR.get(slug) ?? BY_SLUG_EN.get(slug);
  return BY_SLUG_EN.get(slug);
}

/** All policies for a locale — used by any index or sitemap that lists them. */
export function policiesFor(locale: string = 'en'): ReadonlyArray<PolicyDoc> {
  return locale === 'ar' ? POLICIES_AR : POLICIES;
}

/** Substitute the store tokens so the copy reads as the merchant's own. */
export function fillTokens(value: string, store: string, email: string): string {
  return value.split('{{store}}').join(store).split('{{email}}').join(email);
}
