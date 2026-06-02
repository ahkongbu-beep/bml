// 약관 화면에서 동의 확인 후 StepThree로 신호를 전달하는 모듈 레벨 상태
const consentPending = {
  privacy: false,
  terms: false,
};

export const setConsentPending = (type: 'privacy' | 'terms') => {
  consentPending[type] = true;
};

export const consumeConsentPending = () => {
  const result = { ...consentPending };
  consentPending.privacy = false;
  consentPending.terms = false;
  return result;
};
