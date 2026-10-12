import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { capturePlatformReferral } from '../shared/marketing/platform-referral';

export default function PlatformReferralCapture() {
    const location = useLocation();
    useEffect(() => { capturePlatformReferral(); }, [location.search]);
    return null;
}
