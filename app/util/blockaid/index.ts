import {
  Reason,
  ResultType,
  SecurityAlertResponse,
} from '../../components/UI/BlockaidBanner/BlockaidBanner.types';

// eslint-disable-next-line import/prefer-default-export
export const isBlockaidFeatureEnabled = () =>
  process.env.MM_BLOCKAID_UI_ENABLED === 'true';

export const getBlockaidMetricsParams = (
  securityAlertResponse?: SecurityAlertResponse,
) => {
  const additionalParams: Record<string, any> = {};
  additionalParams.security_alert_reason = Reason.notApplicable;

  if (securityAlertResponse && isBlockaidFeatureEnabled()) {
    const { result_type, reason, providerRequestsCount } =
      securityAlertResponse;

    if (result_type !== ResultType.Benign) {
      if (result_type === ResultType.Malicious) {
        additionalParams.ui_customizations = ['flagged_as_malicious'];
      }

      if (reason) {
        additionalParams.security_alert_response = result_type;
        additionalParams.security_alert_reason = reason;
      }

      if (result_type === ResultType.RequestInProgress) {
        additionalParams.ui_customizations = ['security_alert_loading'];
        additionalParams.security_alert_response = 'loading';
      }
    }

    // add counts of each RPC call
    if (providerRequestsCount) {
      Object.keys(providerRequestsCount).forEach((key: string) => {
        const metricKey = `ppom_${key}_count`;
        additionalParams[metricKey] = providerRequestsCount[key];
      });
    }
  }

  return additionalParams;
};
