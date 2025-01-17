import { InteractionEvent } from '@logto/schemas';

import { getSsoAuthorizationUrl } from '#src/api/interaction-sso.js';
import { putInteraction } from '#src/api/interaction.js';
import { createSsoConnector } from '#src/api/sso-connector.js';
import { ProviderName, logtoUrl } from '#src/constants.js';
import { initClient } from '#src/helpers/client.js';

describe('Single Sign On Sad Path', () => {
  const state = 'foo_state';
  const redirectUri = 'http://foo.dev/callback';

  it('should throw 404 if session not found', async () => {
    const { id } = await createSsoConnector({
      providerName: ProviderName.OIDC,
      connectorName: 'test-oidc',
      config: {
        clientId: 'foo',
        clientSecret: 'bar',
        issuer: `${logtoUrl}/oidc`,
      },
    });

    const client = await initClient();

    await expect(
      client.send(getSsoAuthorizationUrl, {
        connectorId: id,
        state,
        redirectUri,
      })
    ).rejects.toThrow();
  });

  it('should throw if connector not found', async () => {
    const client = await initClient();

    await client.successSend(putInteraction, {
      event: InteractionEvent.SignIn,
    });

    await expect(
      client.send(getSsoAuthorizationUrl, {
        connectorId: 'foo',
        state,
        redirectUri,
      })
    ).rejects.toThrow();
  });

  it('should throw if connector config is invalid', async () => {
    const { id } = await createSsoConnector({
      providerName: ProviderName.OIDC,
      connectorName: 'test-oidc',
      config: {
        clientId: 'foo',
        clientSecret: 'bar',
      },
    });

    const client = await initClient();

    await client.successSend(putInteraction, {
      event: InteractionEvent.SignIn,
    });

    await expect(
      client.send(getSsoAuthorizationUrl, {
        connectorId: id,
        state,
        redirectUri,
      })
    ).rejects.toThrow();
  });
});
