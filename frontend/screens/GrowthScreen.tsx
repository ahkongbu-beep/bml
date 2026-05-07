import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GrowthPercentileData } from '../types/GrowthTypes';
import { PERCENTILES } from '../libs/utils/codes/GrowthCode';
import Layout from '@/components/Layout';
import Header from '../components/Header';
import { useGrowth } from '../libs/hooks/useGrowths';
export interface GrowthPoint {
  months: number;
  value: number;
}

function getNearestValue(points: GrowthPoint[], month: number): number | null {
  if (!Array.isArray(points) || points.length === 0) return null;
  const nearest = [...points].sort((a, b) => Math.abs(a.months - month) - Math.abs(b.months - month))[0];
  return nearest?.value ?? null;
}

function estimatePercentile(
  userValue: number,
  values: Array<{ rank: number; value: number | null }>,
): number | null {
  const valid = values
    .filter((v): v is { rank: number; value: number } => v.value !== null)
    .sort((a, b) => a.rank - b.rank);

  if (valid.length < 2) return null;

  if (userValue <= valid[0].value) return valid[0].rank;
  if (userValue >= valid[valid.length - 1].value) return valid[valid.length - 1].rank;

  for (let i = 0; i < valid.length - 1; i++) {
    const low = valid[i];
    const high = valid[i + 1];
    if (userValue >= low.value && userValue <= high.value) {
      const gap = high.value - low.value;
      if (gap <= 0) return low.rank;
      const ratio = (userValue - low.value) / gap;
      return low.rank + ratio * (high.rank - low.rank);
    }
  }

  return null;
}

function PercentileProgressCard({
  title,
  unit,
  data,
  month,
  myValue,
}: {
  title: string;
  unit: string;
  data: GrowthPercentileData;
  month: number;
  myValue: number | null;
}) {
  const values = useMemo(() => {
    return PERCENTILES.map((p) => ({
      ...p,
      value: getNearestValue(data[p.key] ?? [], month),
    }));
  }, [data, month]);

  const hasValues = values.some((v) => v.value !== null);
  const myPercentile = useMemo(() => {
    if (myValue === null || Number.isNaN(myValue)) return null;
    return estimatePercentile(myValue, values);
  }, [myValue, values]);

  const myTopPercent = myPercentile === null ? null : Math.max(0, 100 - myPercentile);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      {!hasValues ? (
        <Text style={styles.emptyText}>데이터가 없습니다.</Text>
      ) : (
        <>
          <View style={styles.progressWrap}>
            <LinearGradient
              colors={['#7EC8FF', '#73E0B5', '#F8D779', '#FF9AA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBar}
            />

            {values.map((item) => (
              <View
                key={item.key}
                style={[
                  styles.marker,
                  { left: `${item.rank}%` },
                ]}
              >
                <Text style={styles.markerRank}>{item.rank}%</Text>
              </View>
            ))}

            {myPercentile !== null && (
              <View style={[styles.myMarker, { left: `${myPercentile}%` }]}>
                <View style={styles.myMarkerDot} />
                <Ionicons name="arrow-down" size={12} color="#FF4D60" style={styles.myMarkerIcon} />
              </View>
            )}
          </View>

          <View style={styles.guideRow}>
            <Text style={styles.guideText}>하위권</Text>
            <Text style={styles.guideText}>평균권</Text>
            <Text style={styles.guideText}>상위권</Text>
          </View>

          <View style={styles.rankTable}>
            {values
              .slice()
              .reverse()
              .map((item) => (
                <View key={`${title}-${item.key}`} style={styles.rankRow}>
                  <Text style={styles.rankLabel}>상위 {100 - item.rank}%</Text>
                  <Text style={styles.rankValue}>
                    {item.value === null ? '-' : `${item.value.toFixed(1)}${unit}`}
                  </Text>
                </View>
              ))}
          </View>

          {myPercentile !== null && myTopPercent !== null && (
            <View style={styles.mySummaryBox}>
              <Text style={styles.mySummaryText}>
                내 수치 {myValue?.toFixed(1)}{unit} 는 또래 대비 상위 {myTopPercent.toFixed(1)}% 수준입니다.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export default function GrowthScreen({ navigation }: any) {
  const [gender, setGender] = useState<'M' | 'W'>('M');
  const [months, setMonths] = useState('');
  const [myHeight, setMyHeight] = useState('');
  const [myWeight, setMyWeight] = useState('');
  const [myHeader, setMyHeader] = useState('');
  const [requestedMonth, setRequestedMonth] = useState<number | null>(null);

  const { data: growthResponse, isLoading: growthLoading } = useGrowth(
    {
      gender,
      months: requestedMonth ?? undefined,
    },
    requestedMonth !== null,
  );

  const growthData = growthResponse?.success ? (growthResponse.data as GrowthData) : undefined;
  const hasGrowthData = !!growthData?.height?.[gender] && !!growthData?.weight?.[gender];

  const parsedMonths = parseInt(months, 10);
  const parsedHeight = parseFloat(myHeight);
  const parsedWeight = parseFloat(myWeight);
  const parsedHeader = parseFloat(myHeader);
  const isValidMonths = Number.isInteger(parsedMonths) && parsedMonths >= 0 && parsedMonths <= 71;
  const isValidHeight = !Number.isNaN(parsedHeight);
  const isValidWeight = !Number.isNaN(parsedWeight);

  const heightData: GrowthPercentileData = hasGrowthData ? growthData!.height[gender] : {};
  const weightData: GrowthPercentileData = hasGrowthData ? growthData!.weight[gender] : {};
  const headerData: GrowthPercentileData = hasGrowthData ? growthData!.header[gender] : {};

  return (
    <Layout>
      <View style={styles.container}>
        <Header
          title="성장 지표"
          leftButton={{
            icon: 'arrow-back',
            onPress: () => navigation.goBack(),
          }}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>또래 성장 분포 조회</Text>

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>성별</Text>
              <Text style={styles.requiredMark}>*</Text>
            </View>
            <View style={styles.genderRow}>
              {(['M', 'W'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && (g === 'M' ? styles.genderBtnActiveM : styles.genderBtnActiveW)]}
                  onPress={() => {
                    setGender(g);
                    setRequestedMonth(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>
                    {g === 'M' ? '남아' : '여아'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow2Col}>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>개월수</Text>
                  <Text style={styles.requiredMark}>*</Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputBox}
                    placeholder="예: 12"
                    placeholderTextColor="#C8C8C8"
                    keyboardType="number-pad"
                    value={months}
                    onChangeText={(t) => {
                      setMonths(t.replace(/[^0-9]/g, ''));
                      setRequestedMonth(null);
                    }}
                    maxLength={2}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>아이 키</Text>
                  <Text style={styles.requiredMark}>*</Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputBox}
                    placeholder="예: 75.3"
                    placeholderTextColor="#C8C8C8"
                    keyboardType="decimal-pad"
                    value={myHeight}
                    onChangeText={(t) => setMyHeight(t.replace(/[^0-9.]/g, ''))}
                    maxLength={5}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputRow2Col}>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>아이 체중</Text>
                  <Text style={styles.requiredMark}>*</Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputBox}
                    placeholder="예: 9.6"
                    placeholderTextColor="#C8C8C8"
                    keyboardType="decimal-pad"
                    value={myWeight}
                    onChangeText={(t) => setMyWeight(t.replace(/[^0-9.]/g, ''))}
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>아이 머리둘레(cm)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputBox}
                    placeholder="예: 43.0"
                    placeholderTextColor="#C8C8C8"
                    keyboardType="decimal-pad"
                    value={myHeader}
                    onChangeText={(t) => setMyHeader(t.replace(/[^0-9.]/g, ''))}
                    maxLength={5}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (isValidMonths && isValidHeight && isValidWeight) setRequestedMonth(parsedMonths);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isValidMonths && isValidHeight && isValidWeight ? ['#FF9AA2', '#FF7B89'] : ['#DDD', '#CCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchBtn}
              >
                <Ionicons name="analytics-outline" size={18} color="#FFF" />
                <Text style={styles.searchBtnText}>또래 분포 보기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {requestedMonth !== null && (
            <>
              {growthLoading && (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#FF7B89" />
                  <Text style={styles.loadingText}>성장 데이터를 불러오는 중...</Text>
                </View>
              )}

              {!growthLoading && !hasGrowthData && (
                <View style={styles.loadingBox}>
                  <Text style={styles.loadingText}>성장 데이터가 없습니다. 잠시 후 다시 시도해주세요.</Text>
                </View>
              )}

              {!growthLoading && hasGrowthData && (
                <View style={styles.noticeBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#6E6E6E" />
                  <Text style={styles.noticeText}>
                    {requestedMonth}개월 {gender === 'M' ? '남아' : '여아'} 또래의 상위~하위 분포입니다.
                  </Text>
                </View>
              )}

              {!growthLoading && hasGrowthData && (
                <PercentileProgressCard
                  title="키 분포"
                  unit="cm"
                  data={heightData}
                  month={requestedMonth}
                  myValue={!Number.isNaN(parsedHeight) ? parsedHeight : null}
                />
              )}

              {!growthLoading && hasGrowthData && (
                <PercentileProgressCard
                  title="체중 분포"
                  unit="kg"
                  data={weightData}
                  month={requestedMonth}
                  myValue={!Number.isNaN(parsedWeight) ? parsedWeight : null}
                />
              )}

              {!growthLoading && hasGrowthData && (
                <PercentileProgressCard
                  title="머리둘레 분포"
                  unit="cm"
                  data={headerData}
                  month={requestedMonth}
                  myValue={!Number.isNaN(parsedHeader) ? parsedHeader : null}
                />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF7' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#4A4A4A' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#4A4A4A' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginTop: 2 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  genderBtnActiveM: { borderColor: '#74B9FF', backgroundColor: '#EEF5FF' },
  genderBtnActiveW: { borderColor: '#FF9AA2', backgroundColor: '#FFF0F3' },
  genderBtnText: { fontSize: 14, fontWeight: '600', color: '#999' },
  genderBtnTextActive: { color: '#4A4A4A' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#FFE0E5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#4A4A4A',
    backgroundColor: '#FFFAFA',
  },
  inputUnit: { fontSize: 14, color: '#888', minWidth: 24 },
  inputRow2Col: { flexDirection: 'row', gap: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  requiredMark: { fontSize: 13, fontWeight: '600', color: '#FF4D60' },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
  },
  searchBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    paddingVertical: 12,
  },
  loadingText: { fontSize: 13, color: '#777', fontWeight: '500' },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#6E6E6E',
    lineHeight: 18,
  },
  progressWrap: {
    marginTop: 6,
    marginBottom: 6,
    paddingTop: 22,
    paddingHorizontal: 2,
  },
  progressBar: {
    height: 12,
    borderRadius: 8,
  },
  marker: {
    position: 'absolute',
    top: 0,
    marginLeft: -8,
    alignItems: 'center',
  },
  markerRank: {
    fontSize: 10,
    color: '#777',
    fontWeight: '600',
  },
  myMarker: {
    position: 'absolute',
    top: 2,
    marginLeft: -10,
    alignItems: 'center',
  },
  myMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4D60',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  myMarkerText: {
    marginTop: 2,
    fontSize: 10,
    color: '#FF4D60',
    fontWeight: '700',
  },
  myMarkerIcon: {
    marginTop: 2,
  },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 6,
  },
  guideText: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '600',
  },
  rankTable: {
    borderTopWidth: 1,
    borderTopColor: '#F1F1F1',
    marginTop: 4,
    paddingTop: 6,
    gap: 6,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLabel: {
    fontSize: 12,
    color: '#666',
  },
  rankValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  mySummaryBox: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FFD8DF',
  },
  mySummaryText: {
    fontSize: 12,
    color: '#6B4C52',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
  },
});
