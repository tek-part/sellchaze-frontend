import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { storeFeatureDesigns } from '../../apps/storefront/landing/store-feature-designs';
import { StoreFeatureIcon } from '../../apps/storefront/landing/StoreFeatureIcon';
import { HiOutlineXMark } from '../workspace/WorkspaceIcons';
import './testimonial-design-picker.css';
import './store-feature-design-picker.css';

function FeatureDiagram({ design: d }) {
    return <span className={`pl-feature-diagram pl-feature-diagram--${d.kind}${d.frame ? ' pl-feature-diagram--frame' : ''}`} aria-hidden style={{ '--fd-columns': d.columns, '--fd-gap': `${Math.max(4, d.gap / 5)}px`, '--fd-radius': `${d.radius / 4}px`, '--fd-color': d.foreground, '--fd-body': d.bodyColor, '--fd-bg': d.background, '--fd-card': d.cardBackground, '--fd-icon': d.iconColor, '--fd-badge': d.badgeBackground, '--fd-accent': d.accent }}>
        {d.header ? <span className="pl-feature-diagram-heading"><i /><b /></span> : null}
        <span className="pl-feature-diagram-items">{Array.from({ length: d.count }, (_, i) => <span className="pl-feature-diagram-card" key={i}>
            {d.kind === 'numbers' ? <strong>—</strong> : d.kind === 'logos' ? <strong>شعار</strong> : d.kind === 'ticker' ? null : <span className={`pl-feature-diagram-icon pl-feature-diagram-icon--${d.badge}`}><StoreFeatureIcon name={['truck', 'box', 'shield', 'support', 'gift', 'card'][i % 6]} /></span>}
            {d.kind !== 'logos' ? <span className="pl-feature-diagram-copy"><b />{d.kind !== 'ticker' ? <i /> : null}</span> : null}
        </span>)}</span>
    </span>;
}
export default function StoreFeatureDesignPicker({ selected, onSelect, onClose }) {
    return <Dialog open onClose={onClose} className="pl-design-dialog" dir="rtl"><div className="pl-design-backdrop" /><div className="pl-design-dialog-scroll"><DialogPanel className="pl-design-panel"><header><DialogTitle>اختر تنسيق مميزات المتجر</DialogTitle><button type="button" onClick={onClose} aria-label="إغلاق تنسيقات المميزات"><HiOutlineXMark /></button></header><div className="pl-design-grid">{storeFeatureDesigns.map((design, index) => <button type="button" className="pl-design-card" key={design.id} aria-label={`استخدام تنسيق المميزات ${index + 1}: ${design.name}`} aria-pressed={selected === design.id} onClick={() => onSelect(design.id)}><FeatureDiagram design={design} /><span className="pl-design-name">{design.name}<small>تنسيق {index + 1}{design.kind === 'ticker' ? ' · متحرك' : ''}</small></span></button>)}</div></DialogPanel></div></Dialog>;
}
