import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

/**
 * Permissions from AppLayout outlet (same names as Laravel / Spatie).
 */
export function usePermissions() {
    const ctx = useOutletContext() ?? {};
    const permissions = useMemo(() => Array.isArray(ctx.permissions) ? ctx.permissions : [], [ctx.permissions]);
    const can = useMemo(() => (name) => permissions.includes(name), [permissions]);

    return {
        me: ctx.me ?? null,
        isAdmin: Boolean(ctx.isAdmin),
        isSupplier: Boolean(ctx.isSupplier),
        permissions,
        can,
    };
}
