import { condString, joinPath } from '@silverhand/essentials';
import { useTranslation } from 'react-i18next';

import Plus from '@/assets/icons/plus.svg';
import PageMeta from '@/components/PageMeta';
import Button from '@/ds-components/Button';
import Card from '@/ds-components/Card';
import CardTitle from '@/ds-components/CardTitle';
import TabNav, { TabNavItem } from '@/ds-components/TabNav';
import useConfigs from '@/hooks/use-configs';
import useTenantPathname from '@/hooks/use-tenant-pathname';
import * as pageLayout from '@/scss/page-layout.module.scss';

import CreateOrganizationModal from './CreateOrganizationModal';
import OrganizationsTable from './OrganizationsTable';
import EmptyDataPlaceholder from './OrganizationsTable/EmptyDataPlaceholder';
import Settings from './Settings';
import { createPathname, organizationsPathname } from './consts';
import * as styles from './index.module.scss';

const tabs = Object.freeze({
  settings: 'settings',
});

type Props = {
  tab?: keyof typeof tabs;
};

function Organizations({ tab }: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { navigate, match } = useTenantPathname();
  const isCreating = match(createPathname);
  const { configs } = useConfigs();
  const isInitialSetup = !configs?.organizationCreated;

  return (
    <div className={pageLayout.container}>
      <CreateOrganizationModal
        isOpen={isCreating}
        onClose={(createdId?: string) => {
          navigate(organizationsPathname + condString(createdId && `/${createdId}`));
        }}
      />
      <PageMeta titleKey="organizations.page_title" />
      <div className={pageLayout.headline}>
        <CardTitle title="organizations.title" subtitle="organizations.subtitle" />
        {!isInitialSetup && (
          <Button
            icon={<Plus />}
            type="primary"
            size="large"
            title="organizations.create_organization"
            onClick={() => {
              navigate(createPathname);
            }}
          />
        )}
      </div>
      {isInitialSetup && (
        <Card className={styles.emptyCardContainer}>
          <EmptyDataPlaceholder />
        </Card>
      )}
      {!isInitialSetup && (
        <>
          <TabNav className={styles.tabs}>
            <TabNavItem href="/organizations" isActive={!tab}>
              {t('organizations.title')}
            </TabNavItem>
            <TabNavItem
              href={joinPath('/organizations', tabs.settings)}
              isActive={tab === 'settings'}
            >
              {t('general.settings_nav')}
            </TabNavItem>
          </TabNav>
          {!tab && <OrganizationsTable />}
          {tab === 'settings' && <Settings />}
        </>
      )}
    </div>
  );
}

export default Organizations;
