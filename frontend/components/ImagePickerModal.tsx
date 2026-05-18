import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { toastError } from '@/libs/utils/toast';

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CropImageRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResizeHandle = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

type Props = {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  onImageRemoved: () => void;
  aspectRatio?: number; // 예: 1 (정사각형), 4/3, 16/9 등. 기본값 4/3
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const API_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL || 'https://bml-e3uz.onrender.com';

export default function ImagePickerModal({ imageUri, onImageSelected, onImageRemoved, aspectRatio = 4 / 3 }: Props) {
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropSourceUri, setCropSourceUri] = useState<string | null>(null);
  const [cropImageSize, setCropImageSize] = useState<{ width: number; height: number } | null>(null);
  const [cropPreviewSize, setCropPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const [cropImageRect, setCropImageRect] = useState<CropImageRect | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);

  const cropDragStart = useRef({ x: 0, y: 0 });
  const cropLayoutInitializedRef = useRef(false);
  const cropPreviewLayoutLockedRef = useRef(false);
  const lastPreviewSizeRef = useRef<{ width: number; height: number } | null>(null);
  const cropBoxRef = useRef<CropBox>(cropBox);
  const cropImageRectRef = useRef<CropImageRect | null>(cropImageRect);
  const resizeStartBoxRef = useRef<CropBox | null>(null);
  const aspectRatioRef = useRef(aspectRatio);

  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);

  useEffect(() => {
    cropImageRectRef.current = cropImageRect;
  }, [cropImageRect]);

  useEffect(() => {
    aspectRatioRef.current = aspectRatio;
  }, [aspectRatio]);

  useEffect(() => {
    if (!cropModalVisible || !cropImageSize || !cropPreviewSize) {
      return;
    }

    if (cropLayoutInitializedRef.current) {
      return;
    }

    const imageAspect = cropImageSize.width / cropImageSize.height;
    const previewAspect = cropPreviewSize.width / cropPreviewSize.height;

    let renderedWidth = cropPreviewSize.width;
    let renderedHeight = cropPreviewSize.height;

    if (imageAspect > previewAspect) {
      renderedHeight = cropPreviewSize.width / imageAspect;
    } else {
      renderedWidth = cropPreviewSize.height * imageAspect;
    }

    const offsetX = (cropPreviewSize.width - renderedWidth) / 2;
    const offsetY = (cropPreviewSize.height - renderedHeight) / 2;

    const nextRect = {
      x: offsetX,
      y: offsetY,
      width: renderedWidth,
      height: renderedHeight,
    };

    const maxCropWidth = renderedWidth * 0.9;
    const maxCropHeight = renderedHeight * 0.9;
    const cropWidthByHeight = maxCropHeight * aspectRatio;
    const initialCropWidth = Math.min(maxCropWidth, cropWidthByHeight);
    const initialCropHeight = initialCropWidth / aspectRatio;

    const nextBox = {
      width: initialCropWidth,
      height: initialCropHeight,
      x: (renderedWidth - initialCropWidth) / 2,
      y: (renderedHeight - initialCropHeight) / 2,
    };

    setCropImageRect(nextRect);
    setCropBox(nextBox);
    cropBoxRef.current = nextBox;
    cropImageRectRef.current = nextRect;
    cropLayoutInitializedRef.current = true;
  }, [cropModalVisible, cropImageSize, cropPreviewSize, aspectRatio]);

  const resizeCropBox = (handle: ResizeHandle, dx: number, dy: number) => {
    const rect = cropImageRectRef.current;
    const start = resizeStartBoxRef.current;
    if (!rect || !start) {
      return;
    }

    const ratio = aspectRatioRef.current;

    let deltaWByX = 0;
    let deltaWByY = 0;
    let anchorX = 0;
    let anchorY = 0;
    let maxWidthByX = 0;
    let maxWidthByY = 0;

    if (handle === 'topLeft') {
      deltaWByX = -dx;
      deltaWByY = -dy * ratio;
      anchorX = start.x + start.width;
      anchorY = start.y + start.height;
      maxWidthByX = anchorX;
      maxWidthByY = anchorY * ratio;
    } else if (handle === 'topRight') {
      deltaWByX = dx;
      deltaWByY = -dy * ratio;
      anchorX = start.x;
      anchorY = start.y + start.height;
      maxWidthByX = rect.width - anchorX;
      maxWidthByY = anchorY * ratio;
    } else if (handle === 'bottomLeft') {
      deltaWByX = -dx;
      deltaWByY = dy * ratio;
      anchorX = start.x + start.width;
      anchorY = start.y;
      maxWidthByX = anchorX;
      maxWidthByY = (rect.height - anchorY) * ratio;
    } else {
      deltaWByX = dx;
      deltaWByY = dy * ratio;
      anchorX = start.x;
      anchorY = start.y;
      maxWidthByX = rect.width - anchorX;
      maxWidthByY = (rect.height - anchorY) * ratio;
    }

    const deltaW = Math.abs(deltaWByX) > Math.abs(deltaWByY) ? deltaWByX : deltaWByY;
    const minWidth = Math.max(60, rect.width * 0.15);
    const maxWidth = Math.max(minWidth, Math.min(maxWidthByX, maxWidthByY));

    const nextWidth = clamp(start.width + deltaW, minWidth, maxWidth);
    const nextHeight = nextWidth / ratio;

    let nextX = start.x;
    let nextY = start.y;

    if (handle === 'topLeft') {
      nextX = anchorX - nextWidth;
      nextY = anchorY - nextHeight;
    } else if (handle === 'topRight') {
      nextX = anchorX;
      nextY = anchorY - nextHeight;
    } else if (handle === 'bottomLeft') {
      nextX = anchorX - nextWidth;
      nextY = anchorY;
    } else {
      nextX = anchorX;
      nextY = anchorY;
    }

    const next = {
      x: clamp(nextX, 0, Math.max(0, rect.width - nextWidth)),
      y: clamp(nextY, 0, Math.max(0, rect.height - nextHeight)),
      width: nextWidth,
      height: nextHeight,
    };

    setCropBox(next);
    cropBoxRef.current = next;
  };

  const cropPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        cropDragStart.current = {
          x: cropBoxRef.current.x,
          y: cropBoxRef.current.y,
        };
      },
      onPanResponderMove: (_, gestureState) => {
        const rect = cropImageRectRef.current;
        if (!rect) {
          return;
        }

        setCropBox((prev) => {
          const maxX = Math.max(0, rect.width - prev.width);
          const maxY = Math.max(0, rect.height - prev.height);

          const newX = clamp(cropDragStart.current.x + gestureState.dx, 0, maxX);
          const newY = clamp(cropDragStart.current.y + gestureState.dy, 0, maxY);

          const next = { ...prev, x: newX, y: newY };
          cropBoxRef.current = next;
          return next;
        });
      },
      onPanResponderRelease: () => {
        cropDragStart.current = {
          x: cropBoxRef.current.x,
          y: cropBoxRef.current.y,
        };
      },
      onPanResponderTerminate: () => {
        cropDragStart.current = {
          x: cropBoxRef.current.x,
          y: cropBoxRef.current.y,
        };
      },
    })
  ).current;

  const topLeftHandleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartBoxRef.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (_, gestureState) => {
        resizeCropBox('topLeft', gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: () => {
        resizeStartBoxRef.current = null;
      },
      onPanResponderTerminate: () => {
        resizeStartBoxRef.current = null;
      },
    })
  ).current;

  const topRightHandleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartBoxRef.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (_, gestureState) => {
        resizeCropBox('topRight', gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: () => {
        resizeStartBoxRef.current = null;
      },
      onPanResponderTerminate: () => {
        resizeStartBoxRef.current = null;
      },
    })
  ).current;

  const bottomLeftHandleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartBoxRef.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (_, gestureState) => {
        resizeCropBox('bottomLeft', gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: () => {
        resizeStartBoxRef.current = null;
      },
      onPanResponderTerminate: () => {
        resizeStartBoxRef.current = null;
      },
    })
  ).current;

  const bottomRightHandleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        resizeStartBoxRef.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (_, gestureState) => {
        resizeCropBox('bottomRight', gestureState.dx, gestureState.dy);
      },
      onPanResponderRelease: () => {
        resizeStartBoxRef.current = null;
      },
      onPanResponderTerminate: () => {
        resizeStartBoxRef.current = null;
      },
    })
  ).current;

  const resetCropState = () => {
    cropLayoutInitializedRef.current = false;
    cropPreviewLayoutLockedRef.current = false;
    lastPreviewSizeRef.current = null;
    setCropSourceUri(null);
    setCropImageSize(null);
    setCropPreviewSize(null);
    setCropImageRect(null);
    setCropBox({ x: 0, y: 0, width: 0, height: 0 });
  };

  const openCropModal = (sourceUri: string, imageWidth: number, imageHeight: number) => {
    cropLayoutInitializedRef.current = false;
    cropPreviewLayoutLockedRef.current = false;
    lastPreviewSizeRef.current = null;
    setCropSourceUri(sourceUri);
    setCropImageSize({ width: imageWidth, height: imageHeight });
    setCropPreviewSize(null);
    setCropImageRect(null);
    setCropModalVisible(true);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toastError('갤러리 접근 권한이 필요합니다.');
      return;
    }

    const imagePickerAny = ImagePicker as any;
    const result = await ImagePicker.launchImageLibraryAsync({
      ...(imagePickerAny?.MediaType?.Images
        ? { mediaTypes: [imagePickerAny.MediaType.Images] }
        : {}),
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      openCropModal(asset.uri, asset.width, asset.height);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toastError('카메라 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      openCropModal(asset.uri, asset.width, asset.height);
    }
  };

  const handleCancelCrop = () => {
    setCropModalVisible(false);
    resetCropState();
  };

  const handleApplyCrop = async () => {
    if (!cropSourceUri || !cropImageRect || !cropImageSize || cropBox.width <= 0 || cropBox.height <= 0) {
      toastError('자르기 정보를 확인할 수 없습니다.');
      return;
    }

    try {
      setIsCropping(true);

      const scaleX = cropImageSize.width / cropImageRect.width;
      const scaleY = cropImageSize.height / cropImageRect.height;

      let originX = Math.round(cropBox.x * scaleX);
      let originY = Math.round(cropBox.y * scaleY);
      let width = Math.round(cropBox.width * scaleX);
      let height = Math.round(cropBox.height * scaleY);

      originX = clamp(originX, 0, Math.max(0, cropImageSize.width - 1));
      originY = clamp(originY, 0, Math.max(0, cropImageSize.height - 1));
      width = clamp(width, 1, cropImageSize.width - originX);
      height = clamp(height, 1, cropImageSize.height - originY);

      const formData = new FormData();
      formData.append('file', {
        uri: cropSourceUri,
        type: 'image/jpeg',
        name: 'crop.jpg',
      } as any);
      formData.append('origin_x', originX.toString());
      formData.append('origin_y', originY.toString());
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      formData.append('quality', '80');

      const response = await fetch(`${API_BASE_URL}/image/crop`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '크롭 실패');
      }

      // 서버에서 반환한 경로를 로컬에 다운로드
      const serverUri = `${API_BASE_URL}${result.data.uri}`;
      console.log(serverUri);
      const localPath = `${FileSystem.cacheDirectory}crop_${Date.now()}.jpg`;
      const download = await FileSystem.downloadAsync(serverUri, localPath);

      onImageSelected(download.uri);
      handleCancelCrop();
    } catch {
      toastError('이미지 자르기에 실패했습니다.');
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
          <TouchableOpacity style={styles.imageRemoveButton} onPress={onImageRemoved}>
            <Ionicons name="close-circle" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.imageButtonContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={10} color="#FF9AA2" />
            <Text style={styles.imageButtonText}>촬영</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
            <Ionicons name="images" size={10} color="#FF9AA2" />
            <Text style={styles.imageButtonText}>갤러리</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={cropModalVisible} transparent animationType="slide" onRequestClose={handleCancelCrop}>
        <View style={styles.cropOverlay}>
          <View style={styles.cropContainer}>
            <Text style={styles.cropTitle}>사진 자르기</Text>
            <Text style={styles.cropDescription}>모서리를 드래그해 크기를 조절하고, 가운데를 드래그해 위치를 이동하세요.</Text>

            <View
              style={styles.cropPreviewArea}
              onLayout={(event) => {
                if (cropPreviewLayoutLockedRef.current) {
                  return;
                }

                const { width, height } = event.nativeEvent.layout;
                const prev = lastPreviewSizeRef.current;

                if (
                  prev &&
                  Math.abs(prev.width - width) < 1 &&
                  Math.abs(prev.height - height) < 1
                ) {
                  return;
                }

                lastPreviewSizeRef.current = { width, height };
                cropPreviewLayoutLockedRef.current = true;
                setCropPreviewSize({ width, height });
              }}
            >
              {cropSourceUri ? (
                <Image
                  source={{ uri: cropSourceUri }}
                  resizeMode="contain"
                  style={styles.cropPreviewImage}
                  onError={() => {
                    setCropModalVisible(false);
                    resetCropState();
                    toastError('이미지 정보를 불러오지 못했습니다.');
                  }}
                />
              ) : null}

              {cropImageRect && cropBox.width > 0 && cropBox.height > 0 ? (
                <View
                  style={[
                    styles.cropBox,
                    {
                      left: cropImageRect.x + cropBox.x,
                      top: cropImageRect.y + cropBox.y,
                      width: cropBox.width,
                      height: cropBox.height,
                    },
                  ]}
                >
                  <View style={styles.cropMoveArea} {...cropPanResponder.panHandlers}>
                    <View style={styles.cropMoveBadge}>
                      <Ionicons name="move" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={[styles.cropHandle, styles.cropHandleTopLeft]} {...topLeftHandleResponder.panHandlers} />
                  <View style={[styles.cropHandle, styles.cropHandleTopRight]} {...topRightHandleResponder.panHandlers} />
                  <View style={[styles.cropHandle, styles.cropHandleBottomLeft]} {...bottomLeftHandleResponder.panHandlers} />
                  <View style={[styles.cropHandle, styles.cropHandleBottomRight]} {...bottomRightHandleResponder.panHandlers} />
                  <View style={[styles.cropCornerMark, styles.cropCornerTopLeft]} />
                  <View style={[styles.cropCornerMark, styles.cropCornerTopRight]} />
                  <View style={[styles.cropCornerMark, styles.cropCornerBottomLeft]} />
                  <View style={[styles.cropCornerMark, styles.cropCornerBottomRight]} />
                  {/* move hint */}
                  <View style={styles.cropMoveHint} pointerEvents="none">
                    <Ionicons name="move" size={14} color="#FFFFFF" />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.cropButtonRow}>
              <TouchableOpacity
                style={styles.cropCancelButton}
                onPress={handleCancelCrop}
                disabled={isCropping}
                activeOpacity={0.8}
              >
                <Text style={styles.cropCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cropApplyButton}
                onPress={handleApplyCrop}
                disabled={isCropping}
                activeOpacity={0.8}
              >
                {isCropping ? (
                  <ActivityIndicator size="small" color="#FF6B7A" />
                ) : (
                  <Text style={styles.cropApplyButtonText}>자르기 적용</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  imagePreviewContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
  },
  imageButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFD7DE',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#FFF8FA',
  },
  imageButtonText: {
    marginLeft: 6,
    color: '#FF6B7A',
    fontWeight: '600',
    fontSize: 13,
  },
  cropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  cropContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },
  cropTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  cropDescription: {
    marginTop: 6,
    fontSize: 13,
    color: '#7A7A7A',
  },
  cropPreviewArea: {
    marginTop: 14,
    width: '100%',
    height: 360,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F7F7F7',
  },
  cropPreviewImage: {
    width: '100%',
    height: '100%',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  cropMoveArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropMoveBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropHandle: {
    position: 'absolute',
    width: 28,
    height: 28,
    zIndex: 3,
  },
  cropHandleTopLeft: {
    left: -14,
    top: -14,
  },
  cropHandleTopRight: {
    right: -14,
    top: -14,
  },
  cropHandleBottomLeft: {
    left: -14,
    bottom: -14,
  },
  cropHandleBottomRight: {
    right: -14,
    bottom: -14,
  },
  cropCornerMark: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  cropCornerTopLeft: {
    left: -2,
    top: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cropCornerTopRight: {
    right: -2,
    top: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cropCornerBottomLeft: {
    left: -2,
    bottom: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cropCornerBottomRight: {
    right: -2,
    bottom: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cropMoveHint: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cropButtonRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  cropCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cropCancelButtonText: {
    color: '#666666',
    fontWeight: '600',
  },
  cropApplyButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFB3BC',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cropApplyButtonText: {
    color: '#FF6B7A',
    fontWeight: '700',
  },
});