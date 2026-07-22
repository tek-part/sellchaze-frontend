import { useParams } from 'react-router-dom';

/**
 * Resolves the store context for both dashboards under the single-store model:
 *
 *  - Owner (Merchant/Supplier): routes carry NO :id — the one store is resolved
 *    server-side from the authenticated user. API calls go to `/my-store/*` and
 *    in-app links stay under `/store/*`.
 *  - Admin: `/stores/:id/*` targets a specific store; both bases keep the id.
 *
 * Pages build URLs from `apiBase` (API calls) and `uiBase` (navigation) so the
 * same components serve owners and admins unchanged.
 */
export default function useStoreScope() {
    const { id } = useParams();
    const owner = !id;

    return {
        id: id || null,
        owner,
        apiBase: owner ? '/my-store' : `/stores/${id}`,
        uiBase: owner ? '/store' : `/stores/${id}`,
    };
}
