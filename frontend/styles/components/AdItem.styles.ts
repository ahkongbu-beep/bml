import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0E2CE',
  },
  topBar: {
    height: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
  },
  badgeWrap: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  profileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 220,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#EEE',
  },
  profileNickname: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  image: {
    height: 180,
    backgroundColor: '#F7F7F7',
  },
  dotWrap: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  confirmRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F4',
  },
  confirmButton: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFE8DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#F6F6F6',
    borderColor: '#EFEFEF',
  },
  confirmButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmButtonText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '700',
    textAlign: 'left',
  },
  confirmButtonArrow: {
    fontSize: 15,
    color: '#777',
    fontWeight: '700',
  },
  contentWrap: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 12,
  },
  contents: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
});

export default styles;