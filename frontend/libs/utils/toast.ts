import Toast from 'react-native-toast-message';

type ToastOptions = {
  onHide?: () => void;
  onPress?: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
  topOffset?: number;
  bottomOffset?: number;
};

const showToast = (
  type: 'success' | 'error' | 'info',
  msg: string,
  options?: ToastOptions
) => {
  Toast.show({
    type,
    text1: msg,
    visibilityTime: options?.duration ?? 2000,
    onHide: options?.onHide,
    onPress: options?.onPress,
    position: options?.position ?? 'top',
    topOffset: options?.topOffset,
    bottomOffset: options?.bottomOffset,
  });
};

export const toastSuccess = (msg: string, options?: ToastOptions) => {
  const defaultOptions: ToastOptions = {
    position: 'bottom',
    topOffset: 60,
  };
  showToast('success', msg, { ...defaultOptions, ...options });
}

export const toastError = (msg: string, options?: ToastOptions) => {
  const defaultOptions: ToastOptions = {
    position: 'top',
    topOffset: 60,
  };
  showToast('error', msg, { ...defaultOptions, ...options });
}


export const toastInfo = (msg: string, options?: ToastOptions) => {
  const defaultOptions: ToastOptions = {
    position: 'top',
    topOffset: 60,
  };
  showToast('info', msg, { ...defaultOptions, ...options });
}
