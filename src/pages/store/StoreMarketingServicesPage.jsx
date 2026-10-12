import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStoreContext from '../../hooks/useStoreContext';
import './marketing-services.css';

const jobsUrl = 'https://www.top-mb.com/jobs';

export default function StoreMarketingServicesPage() {
    const { access, uiBase } = useStoreContext();
    const { i18n } = useTranslation();
    const ar = i18n.language.startsWith('ar');
    const text = (arabic, english) => ar ? arabic : english;
    if (!access.canStoreSettings) return <Navigate to={`${uiBase}/overview`} replace />;
    return <div className="ws-marketing-services" dir={ar ? 'rtl' : 'ltr'}>
        <div className="ws-marketing-services-panel">
            <div className="ws-marketing-services-brands"><strong>Sellchaze</strong><span dir="ltr">Top Media Buyers</span></div>
            <h1>{text('خدمات التسويق', 'Marketing services')}</h1>
            <p className="ws-marketing-services-intro">{text('ابحث عن مسوقين ومشروعات تسويق عبر منصة Top Media Buyers الخارجية.', 'Find marketers and marketing projects on the external Top Media Buyers platform.')}</p>
            <div className="ws-marketing-services-columns">
                <section>
                    <h2>{text('هل تريد مسوقين؟', 'Looking for marketers?')}</h2>
                    <p>{text('اعرض مشروعك ليتمكن المسوقون من التقديم عليه.', 'List your project so marketers can apply.')}</p>
                    <p>{text('راجع ملفات المسوقين وأعمالهم السابقة وتواصل مع المرشحين المناسبين لمشروعك عبر منصة توب ميديا بايرز.', 'Review marketers’ profiles and previous work, then contact suitable candidates through Top Media Buyers.')}</p>
                    <p>{text('جهّز تفاصيل الوظيفة والدولة المستهدفة ومجال العمل ووسيلة التواصل قبل نشر الطلب.', 'Prepare the job details, target country, industry and contact method before posting.')}</p>
                    <a href={jobsUrl} target="_blank" rel="noopener noreferrer">{text('انشر وظيفة', 'Post a job')}</a>
                </section>
                <section>
                    <h2>{text('هل انت مسوق وتريد مشاريع لتقوم بها', 'Are you a marketer looking for projects?')}</h2>
                    <p>{text('يمكنك مشاهدة المشاريع المفتوحة والتقديم على ما يناسب خبرتك.', 'Browse open projects and apply to those that match your experience.')}</p>
                    <p>{text('جهّز ملفك وأعمالك السابقة على منصة توب ميديا بايرز ليتمكن أصحاب المشروعات من التعرف على خبرتك في التسويق.', 'Prepare your profile and previous work on Top Media Buyers so project owners can review your marketing experience.')}</p>
                    <p>{text('راجع تفاصيل المشروع وشروطه قبل التقديم.', 'Review the project details and terms before applying.')}</p>
                    <a href={jobsUrl} target="_blank" rel="noopener noreferrer">{text('مشاهدة الوظائف', 'View jobs')}</a>
                </section>
            </div>
        </div>
        <p className="ws-marketing-services-note">{text('ستحتاج إلى حساب في Top Media Buyers لنشر وظيفة أو التقديم على المشروعات.', 'You will need a Top Media Buyers account to post a job or apply to projects.')}</p>
    </div>;
}
