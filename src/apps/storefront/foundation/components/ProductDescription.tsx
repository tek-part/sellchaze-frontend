import { useEffect, useRef } from 'react';

/** HTML is sanitized by the API mapper before reaching this component. */
export function ProductDescription({ html }: { html: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Rich HTML is inserted as a fragment. Start media selection after insertion,
    // including when translated copy replaces a previously mounted fragment.
    const videos = Array.from(root.current?.querySelectorAll('video') ?? []);
    videos.forEach((video) => video.load());
    return () => videos.forEach((video) => video.pause());
  }, [html]);
  return <div ref={root} className="sf-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
