import {
  SupportedSigningKeyAlgorithm,
  type OidcConfigKeysResponse,
  LogtoOidcConfigKeyType,
} from '@logto/schemas';
import { condArray } from '@silverhand/essentials';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trans, useTranslation } from 'react-i18next';
import useSWR from 'swr';

import Delete from '@/assets/icons/delete.svg';
import FormCard from '@/components/FormCard';
import Button from '@/ds-components/Button';
import DangerConfirmModal from '@/ds-components/DeleteConfirmModal';
import DynamicT from '@/ds-components/DynamicT';
import FormField from '@/ds-components/FormField';
import IconButton from '@/ds-components/IconButton';
import Select from '@/ds-components/Select';
import TabNav, { TabNavItem } from '@/ds-components/TabNav';
import Table from '@/ds-components/Table';
import Tag from '@/ds-components/Tag';
import useApi, { type RequestError } from '@/hooks/use-api';

import * as styles from './index.module.scss';

function SigningKeys() {
  const api = useApi();
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console.tenants.signing_keys' });
  const [keyType, setKeyType] = useState<LogtoOidcConfigKeyType>(
    LogtoOidcConfigKeyType.PrivateKeys
  );
  const isPrivateKey = keyType === LogtoOidcConfigKeyType.PrivateKeys;

  const { data, error, mutate } = useSWR<OidcConfigKeysResponse[], RequestError>(
    `api/configs/oidc/${keyType}`
  );
  const [deletingKeyId, setDeletingKeyId] = useState<string>();
  const [showRotateConfirmModal, setShowRotateConfirmModal] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateKeyAlgorithm, setRotateKeyAlgorithm] = useState<SupportedSigningKeyAlgorithm>(
    SupportedSigningKeyAlgorithm.EC
  );

  const isLoadingKeys = !data && !error;

  const tableColumns = useMemo(
    () => [
      {
        title: t('table_column.id'),
        dataIndex: 'id',
        colSpan: 8,
        render: ({ id }: OidcConfigKeysResponse) => <span className={styles.idWrapper}>{id}</span>,
      },
      {
        title: t('table_column.status'),
        dataIndex: 'status',
        colSpan: 4,
        render: (_: OidcConfigKeysResponse, rowIndex: number) => (
          <Tag type="state" variant="plain" status={rowIndex === 0 ? 'success' : 'alert'}>
            {t(rowIndex === 0 ? 'status.current' : 'status.previous')}
          </Tag>
        ),
      },
      ...condArray(
        isPrivateKey && [
          {
            title: t('table_column.algorithm'),
            dataIndex: 'signingKeyAlgorithm',
            colSpan: 7,
            render: ({ signingKeyAlgorithm }: OidcConfigKeysResponse) => (
              <span>{signingKeyAlgorithm}</span>
            ),
          },
        ]
      ),
      {
        title: '',
        dataIndex: 'action',
        colSpan: 2,
        render: ({ id }, rowIndex) =>
          rowIndex !== 0 && (
            <div className={styles.deleteIcon}>
              <IconButton
                onClick={() => {
                  setDeletingKeyId(id);
                }}
              >
                <Delete />
              </IconButton>
            </div>
          ),
      },
    ],
    [isPrivateKey, t]
  );

  return (
    <FormCard title="tenants.signing_keys.title" description="tenants.signing_keys.description">
      <TabNav>
        <TabNavItem
          isActive={keyType === LogtoOidcConfigKeyType.PrivateKeys}
          onClick={() => {
            setKeyType(LogtoOidcConfigKeyType.PrivateKeys);
          }}
        >
          <DynamicT forKey="tenants.signing_keys.type.private_key" />
        </TabNavItem>
        <TabNavItem
          isActive={keyType === LogtoOidcConfigKeyType.CookieKeys}
          onClick={() => {
            setKeyType(LogtoOidcConfigKeyType.CookieKeys);
          }}
        >
          <DynamicT forKey="tenants.signing_keys.type.cookie_key" />
        </TabNavItem>
      </TabNav>
      <FormField title={`tenants.signing_keys.${isPrivateKey ? 'private' : 'cookie'}_keys_in_use`}>
        <Table
          hasBorder
          isRowHoverEffectDisabled
          isLoading={isLoadingKeys || isRotating}
          errorMessage={error?.body?.message ?? error?.message}
          rowIndexKey="id"
          rowGroups={[{ key: 'signing_keys', data }]}
          columns={tableColumns}
          loadingSkeleton={
            <>
              {Array.from({ length: 2 }).map((_, rowIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={`skeleton-row-${rowIndex}`}>
                  {tableColumns.map(({ colSpan }, columnIndex) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <td key={columnIndex} colSpan={colSpan}>
                      <div className={styles.bone} />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          }
        />
      </FormField>
      <FormField title={`tenants.signing_keys.rotate_${isPrivateKey ? 'private' : 'cookie'}_keys`}>
        <div className={styles.rotateKey}>
          <div className={styles.description}>
            {t(`rotate_${isPrivateKey ? 'private' : 'cookie'}_keys_description`)}
          </div>
          <Button
            title={`tenants.signing_keys.rotate_${isPrivateKey ? 'private' : 'cookie'}_keys`}
            type="default"
            onClick={() => {
              setShowRotateConfirmModal(true);
            }}
          />
        </div>
      </FormField>
      <DangerConfirmModal
        confirmButtonText="tenants.signing_keys.rotate_button"
        isOpen={showRotateConfirmModal}
        onCancel={() => {
          setShowRotateConfirmModal(false);
        }}
        onConfirm={async () => {
          setIsRotating(true);
          setShowRotateConfirmModal(false);
          try {
            const keys = await api
              .post(`api/configs/oidc/${keyType}/rotate`, {
                json: { signingKeyAlgorithm: rotateKeyAlgorithm },
              })
              .json<OidcConfigKeysResponse[]>();
            void mutate(keys);
            toast.success(t('messages.rotate_key_success'));
          } finally {
            setIsRotating(false);
          }
        }}
      >
        <span>
          <Trans components={{ strong: <strong /> }}>
            {t(`reminder.rotate_${isPrivateKey ? 'private' : 'cookie'}_key`)}
          </Trans>
        </span>
        {isPrivateKey && (
          <FormField title="tenants.signing_keys.select_private_key_algorithm">
            <Select
              options={Object.values(SupportedSigningKeyAlgorithm).map((value) => ({
                title: value,
                value,
              }))}
              value={rotateKeyAlgorithm}
              onChange={(value) => {
                if (!value) {
                  return;
                }
                setRotateKeyAlgorithm(value);
              }}
            />
          </FormField>
        )}
      </DangerConfirmModal>
      <DangerConfirmModal
        isOpen={Boolean(deletingKeyId)}
        onCancel={() => {
          setDeletingKeyId(undefined);
        }}
        onConfirm={async () => {
          if (!deletingKeyId) {
            return;
          }
          try {
            await api.delete(`api/configs/oidc/${keyType}/${deletingKeyId}`);
            void mutate(data?.filter((key) => key.id !== deletingKeyId));
            toast.success(t('messages.delete_key_success'));
          } finally {
            setDeletingKeyId(undefined);
          }
        }}
      >
        <span>
          <Trans components={{ strong: <strong /> }}>
            {t(`reminder.delete_${isPrivateKey ? 'private' : 'cookie'}_key`)}
          </Trans>
        </span>
      </DangerConfirmModal>
    </FormCard>
  );
}

export default SigningKeys;
