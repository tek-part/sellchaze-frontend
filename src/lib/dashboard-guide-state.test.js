import { describe, expect, it } from 'vitest';
import { previewDashboardGuide } from './dashboard-guide-state';

const initial = () => ({ total:10, completed:{ wallet:false,products:true,categories:false,home:false,domain:true,logo:false,address:false,font:false,color:false,seo:false },
    detected:{ wallet:false,products:true,domain:true }, preferences:{ version:3,completed:{},hidden_panels:[] }, resources:{} });
describe('setup guide acknowledgement preview', () => {
    it('updates only the chosen acknowledgement while preserving detected facts and concurrency version', () => {
        const before=initial();const after=previewDashboardGuide(before,{ completed:{ wallet:true } });
        expect(after.percent).toBe(30);expect(after.done_count).toBe(3);expect(after.completed.products).toBe(true);
        expect(after.detected.wallet).toBe(false);expect(after.preferences.version).toBe(3);
        expect(before.completed.wallet).toBe(false);expect(before.preferences.completed).toEqual({});
    });
    it('removes an acknowledgement without removing other saved choices', () => {
        const before=initial();before.preferences.completed={ wallet:true,logo:true };before.completed.wallet=true;before.completed.logo=true;
        const after=previewDashboardGuide(before,{ completed:{ wallet:false,logo:true } });
        expect(after.percent).toBe(30);expect(after.completed.logo).toBe(true);expect(after.completed.wallet).toBe(false);
    });
    it('dismisses a panel without freezing automatically detected steps or changing completion', () => {
        const before=initial();const after=previewDashboardGuide(before,{ hidden_panels:['setup'] });
        expect(after.percent).toBe(20);expect(after.preferences.completed).toEqual({});expect(after.preferences.hidden_panels).toEqual(['setup']);
        expect(before.preferences.hidden_panels).toEqual([]);
    });
});
