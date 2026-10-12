import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { HiOutlineSun, HiOutlineMoon, HiOutlineComputerDesktop, HiOutlineCheck } from './WorkspaceIcons';
import useWorkspaceCopy from './workspaceCopy';

export default function WorkspaceAppearanceControl({ appearance, inDrawer = false }) {
    const ws = useWorkspaceCopy();
    return <Menu as="div" className="relative">
        <MenuButton className="ws-icon-button" aria-label={ws('appearance')} title={ws('appearance')}>{appearance.theme === 'dark' ? <HiOutlineMoon aria-hidden /> : <HiOutlineSun aria-hidden />}</MenuButton>
        <MenuItems transition anchor={inDrawer ? undefined : 'bottom end'} className={`ws-menu ws-appearance-menu ${inDrawer ? 'ws-drawer-appearance-menu' : ''}`}>
            {[[ 'light', HiOutlineSun ],[ 'dark', HiOutlineMoon ],[ 'system', HiOutlineComputerDesktop ]].map(([key, Icon]) => <MenuItem key={key}><button type="button" className="ws-menu-row" onClick={() => appearance.change(key)} aria-label={ws(key)}><Icon aria-hidden /><span>{ws(key)}</span>{appearance.mode === key ? <HiOutlineCheck aria-hidden className="ws-menu-check" /> : null}</button></MenuItem>)}
        </MenuItems>
    </Menu>;
}
