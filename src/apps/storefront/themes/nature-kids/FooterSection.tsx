import { useId, useState, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
interface Props { title: string; children: ReactNode; collapsible?: boolean; asNav?: boolean; kind?: string }
const subscribe = (listener: () => void): (() => void) => { const query = window.matchMedia('(max-width:767px)'); query.addEventListener('change', listener); return () => query.removeEventListener('change', listener); };
const mobile = (): boolean => window.matchMedia('(max-width:767px)').matches;
function ResponsiveFooterSection({ title, children, asNav, kind }: Props): ReactElement {
 const id = useId(); const phone = useSyncExternalStore(subscribe, mobile, () => false); const [open, setOpen] = useState(false);
 return <div className="nkd-footer-fold" data-kind={kind}><h4>{phone ? <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>{title}<span aria-hidden>{open ? '−' : '+'}</span></button> : title}</h4><div id={id} hidden={phone && !open}>{asNav ? <nav aria-label={title}>{children}</nav> : children}</div></div>;
}
export function NatureFooterSection(props: Props): ReactElement {
 if (props.collapsible) return <ResponsiveFooterSection {...props} />;
 return props.asNav ? <nav aria-label={props.title}><h4>{props.title}</h4>{props.children}</nav> : <div><h4>{props.title}</h4>{props.children}</div>;
}
