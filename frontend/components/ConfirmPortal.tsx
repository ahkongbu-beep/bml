import React from 'react';
import { Text } from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { ConfirmPortalProps } from '@/libs/types/CommonTypes';

export default function ConfirmPortal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  confirmColor = '#FF6B6B',
}: ConfirmPortalProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>{cancelText}</Button>
          <Button onPress={onConfirm} textColor={confirmColor}>
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

