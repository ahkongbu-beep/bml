import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF7' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },

  /* 자녀 탭 */
  childTabRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  childTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  childTabActiveM: { borderColor: '#74B9FF', backgroundColor: '#EEF5FF' },
  childTabActiveW: { borderColor: '#FF9AA2', backgroundColor: '#FFF0F3' },
  childTabText: { fontSize: 14, fontWeight: '600', color: '#999' },
  childTabTextActive: { color: '#4A4A4A' },
  agentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9AA2',
    marginLeft: 2,
  },

  /* 아이 배너 */
  childBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  childGenderBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderM: { backgroundColor: '#EEF5FF' },
  genderW: { backgroundColor: '#FFF0F3' },
  childGenderText: { fontSize: 14, fontWeight: '700', color: '#4A4A4A' },
  childBannerName: { fontSize: 15, fontWeight: '700', color: '#3A3A3A' },
  childBannerBirth: { fontSize: 12, color: '#999', marginTop: 2 },

  /* 로딩/에러/빈 상태 */
  centerBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  centerText: { fontSize: 14, color: '#999', fontWeight: '500' },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#5A5A5A', marginTop: 8 },
  emptyDesc: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20 },
  goRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF9AA2',
    backgroundColor: '#FFF5F6',
  },
  goRecordText: { fontSize: 14, fontWeight: '600', color: '#FF7B89' },

  /* 타임라인 */
  timeline: { gap: 14 },

  /* 날짜 카드 */
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    gap: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9AA2',
  },
  dateText: { fontSize: 13, fontWeight: '700', color: '#7A7A7A' },

  /* 기록 행 */
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInfo: { flex: 1 },
  recordLabel: { fontSize: 13, fontWeight: '700', color: '#4A4A4A' },
  recordMonths: { fontSize: 11, color: '#AAAAAA', marginTop: 1 },
  recordValue: { fontSize: 16, fontWeight: '800' },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  percentText: { fontSize: 11, fontWeight: '700' },
});

export default styles;