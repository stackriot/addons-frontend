import * as api from 'amo/api';
import { reportAddon, reportUser } from 'amo/api/abuse';
import {
  createApiResponse,
  createFakeAddonAbuseReport,
  createFakeUserAbuseReport,
  createUserAccountResponse,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('reportAddon', () => {
    function mockResponse({ addon, message }) {
      return createApiResponse({
        jsonData: createFakeAddonAbuseReport({ addon, message }),
      });
    }

    it('calls the report add-on abuse API', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const reason = 'does_not_work';
      const reporterName = 'Foxy';
      const reporterEmail = 'fox@moz.co';
      const addonId = 'cool-addon';
      const location = 'both';
      const addonVersion = '1.2.3.4';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/addon',
          method: 'POST',
          body: {
            addon: addonId,
            message,
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
            location,
            addon_version: addonVersion,
          },
          apiState,
        })
        .once()
        .returns(
          mockResponse({
            addon: { ...fakeAddon, slug: 'cool-addon' },
            message,
          }),
        );

      await reportAddon({
        addonId,
        api: apiState,
        message,
        reason,
        reporterEmail,
        reporterName,
        location,
        addonVersion,
        auth: true,
      });

      mockApi.verify();
    });
  });

  describe('reportUser', () => {
    function mockResponse({ message, user }) {
      return createApiResponse({
        jsonData: createFakeUserAbuseReport({ message, user }),
      });
    }

    it('calls the report add-on abuse API', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const userId = 1234;
      const user = createUserAccountResponse({ id: userId });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/user',
          method: 'POST',
          body: {
            user: `${userId}`,
            message,
            reason: undefined,
            reporter_email: undefined,
            reporter_name: undefined,
          },
          apiState,
        })
        .once()
        .returns(mockResponse({ message, user }));

      await reportUser({ api: apiState, message, userId: user.id });

      mockApi.verify();
    });

    it('calls the report add-on abuse API with more information', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const reason = 'other';
      const reporterEmail = 'some-reporter-email';
      const reporterName = 'some-reporter-name';
      const userId = 1234;
      const user = createUserAccountResponse({ id: userId });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/user',
          method: 'POST',
          body: {
            user: `${userId}`,
            message: undefined,
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
          },
          apiState,
        })
        .once()
        .returns(
          mockResponse({
            message: '',
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
            user,
          }),
        );

      await reportUser({
        api: apiState,
        userId: user.id,
        reason,
        reporterEmail,
        reporterName,
      });

      mockApi.verify();
    });

    it('allows the report add-on abuse API to be called anonymously', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const userId = 1234;
      const user = createUserAccountResponse({ id: userId });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: false,
          endpoint: 'abuse/report/user',
          method: 'POST',
          body: {
            user: `${userId}`,
            message,
            reason: undefined,
            reporter_email: undefined,
            reporter_name: undefined,
          },
          apiState,
        })
        .once()
        .returns(mockResponse({ message, user }));

      await reportUser({
        api: apiState,
        auth: false,
        message,
        userId: user.id,
      });

      mockApi.verify();
    });
  });

  it.each([undefined, '', null, ' '])(
    'throws when reason is not supplied and message is %s',
    async (message) => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const user = createUserAccountResponse();

      await expect(() =>
        reportUser({ api: apiState, userId: user.id, message }),
      ).toThrow(/message is required when reason isn't specified/);
    },
  );
});
