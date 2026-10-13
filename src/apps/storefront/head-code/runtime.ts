export interface PublishedHeadCode { html: string; host: string; fingerprint: string }

export function mayMountHeadCode(code: PublishedHeadCode, location: Pick<Location, 'hostname' | 'search'>, localStorefrontOnly = false): boolean {
  return /^[a-f0-9]{64}$/.test(code.fingerprint)
    && (location.hostname.toLowerCase() === code.host || (localStorefrontOnly && ['localhost', '127.0.0.1'].includes(location.hostname)));
}

/** Load only for a live tenant page with published code, never the merchant editor. */
export async function mountHeadCode(code: PublishedHeadCode): Promise<void> {
  const localOnly = import.meta.env.DEV && import.meta.env.VITE_DEV_STOREFRONT_ONLY === '1';
  if (!mayMountHeadCode(code, window.location, localOnly) || document.head.querySelector(`meta[name="sellchaze-head-code"][content="${code.fingerprint}"]`)) return;
  const marker = document.createElement('meta'); marker.name = 'sellchaze-head-code'; marker.content = code.fingerprint;
  document.head.append(marker);
  const template = document.createElement('template'); template.innerHTML = code.html;
  // innerHTML is intentionally inert. Recreate script nodes so actual merchant JavaScript runs.
  // Classic external scripts without async retain their document order and inline dependencies.
  const insert = async (node: Node, parent: Node): Promise<void> => {
    if (node instanceof HTMLScriptElement) {
      const script = document.createElement('script');
      for (const attribute of node.attributes) script.setAttribute(attribute.name, attribute.value);
      script.textContent = node.textContent;
      const ordered = !script.hasAttribute('async');
      if (ordered) script.async = false;
      const external = script.hasAttribute('src');
      const executable = !script.type || ['module', 'text/javascript', 'application/javascript'].includes(script.type.toLowerCase());
      const completed = external && executable && ordered ? new Promise<void>((resolve) => {
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener('error', () => resolve(), { once: true });
      }) : null;
      parent.appendChild(script); if (completed) await completed;
    } else if (node instanceof Element && node.tagName !== 'TEMPLATE' && node.tagName !== 'NOSCRIPT') {
      const element = node.cloneNode(false); parent.appendChild(element);
      for (const child of Array.from(node.childNodes)) await insert(child, element);
    } else parent.appendChild(node.cloneNode(true));
  };
  for (const node of Array.from(template.content.childNodes)) await insert(node, document.head);
}
