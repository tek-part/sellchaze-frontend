import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineBuildingOffice2, HiOutlineArrowRight } from 'react-icons/hi2';

/**
 * Call-to-action card inviting factory/supplier owners to add their factory.
 * Links to the registration page.
 */
export default function AddFactoryBanner() {
    const { t } = useTranslation();
    return (
        <div className="mt-12 overflow-hidden rounded-2xl bg-linear-to-br from-brand via-blue-600 to-accent p-8 text-white shadow-card sm:p-10">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 sm:inline-flex">
                        <HiOutlineBuildingOffice2 className="h-6 w-6" />
                    </span>
                    <div>
                        <h2 className="text-xl font-bold sm:text-2xl">
                            {t('sup_dir_add_factory_title', 'Own a factory? Add it here')}
                        </h2>
                        <p className="mt-1 max-w-xl text-sm text-white/80">
                            {t('sup_dir_add_factory_subtitle', 'List your factory in the directory and reach thousands of buyers across Egypt.')}
                        </p>
                    </div>
                </div>
                <Link
                    to="/register"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand shadow-xs transition hover:bg-white/90"
                >
                    {t('sup_dir_add_factory_cta', 'Add your factory')} <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}
