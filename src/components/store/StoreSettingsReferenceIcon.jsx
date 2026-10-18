import { HugeiconsIcon } from '@hugeicons/react';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';
import StoreIcon from '@hugeicons/core-free-icons/Store01Icon';
import WebValidationIcon from '@hugeicons/core-free-icons/WebValidationIcon';
import StoreVerifiedIcon from '@hugeicons/core-free-icons/StoreVerified01Icon';
import CommandLineIcon from '@hugeicons/core-free-icons/CommandLineIcon';
import SeoIcon from '@hugeicons/core-free-icons/SeoIcon';
import CreditCardPosIcon from '@hugeicons/core-free-icons/CreditCardPosIcon';
import MailSetting02Icon from '@hugeicons/core-free-icons/MailSetting02Icon';
import Notification03Icon from '@hugeicons/core-free-icons/Notification03Icon';
import DeliveryTruck02Icon from '@hugeicons/core-free-icons/DeliveryTruck02Icon';
import InstagramIcon from '@hugeicons/core-free-icons/InstagramIcon';
import SourceCodeSquareIcon from '@hugeicons/core-free-icons/SourceCodeSquareIcon';
import WebhookIcon from '@hugeicons/core-free-icons/WebhookIcon';
import LockPasswordIcon from '@hugeicons/core-free-icons/LockPasswordIcon';
import SmartPhone01Icon from '@hugeicons/core-free-icons/SmartPhone01Icon';

// Geometry matched against the reference DOM and the installed Hugeicons package.
const icons = { general: StoreIcon, domains: WebValidationIcon, 'store-info': StoreVerifiedIcon, 'head-code': CommandLineIcon,
    'seo-settings': SeoIcon, payments: CreditCardPosIcon, 'digital-delivery': MailSetting02Icon, 'order-push': Notification03Icon,
    managers: UserGroupIcon, shipping: DeliveryTruck02Icon, 'social-links': InstagramIcon, 'public-api-group': SourceCodeSquareIcon,
    webhooks: WebhookIcon, 'login-sessions': LockPasswordIcon, 'phone-verification': SmartPhone01Icon };

export default function StoreSettingsReferenceIcon({ itemKey, fallback: Fallback, ...props }) {
    return icons[itemKey] ? <HugeiconsIcon icon={icons[itemKey]} size={20} strokeWidth={1.5} {...props} /> : Fallback ? <Fallback {...props} /> : null;
}
