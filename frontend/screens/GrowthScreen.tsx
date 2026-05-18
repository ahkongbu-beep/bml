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
import { GrowthData, GrowthPercentileData } from '../types/GrowthTypes';
import { PERCENTILES } from '../libs/utils/codes/GrowthCode';
import Layout from '@/components/Layout';
import Header from '../components/Header';
import { useCreateGrowthReports, useGrowth } from '../libs/hooks/useGrowths';
import { useAuth } from '../libs/contexts/AuthContext';
import { toastError, toastSuccess } from '@/libs/utils/toast';
import GrowthChildSelectModal from '../components/GrowthChildSelectModal';
import PercentileProgressCard, { getNearestValue, estimatePercentile } from '../components/PercentileProgressCard';

export default function GrowthScreen({ navigation }: any) {
  const { user } = useAuth();
  const [gender, setGender] = useState<'M' | 'W'>('M');
  const [months, setMonths] = useState('');
  const [myHeight, setMyHeight] = useState('');
  const [myWeight, setMyWeight] = useState('');
  const [myHeader, setMyHeader] = useState('');
  const [requestedMonth, setRequestedMonth] = useState<number | null>(null);
  const [childSelectVisible, setChildSelectVisible] = useState(false);
  const createGrowthReportsMutation = useCreateGrowthReports();
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
  const isValidHeader = !Number.isNaN(parsedHeader);

  const heightData: GrowthPercentileData = hasGrowthData ? growthData!.height[gender] : {};
  const weightData: GrowthPercentileData = hasGrowthData ? growthData!.weight[gender] : {};
  const headerData: GrowthPercentileData = hasGrowthData ? growthData!.header[gender] : {};

  const userChilds = user?.user_childs ?? [];
  const hasMultipleChildren = userChilds.length > 1;

  // 단일 자녀면 자동 선택, 다중 자녀면 기본값으로 대표 자녀
  const defaultChildId = useMemo(() => {
    if (!userChilds.length) return null;
    const agentChild = userChilds.find((c) => c.is_agent === 'Y');
    return agentChild?.id ?? userChilds[0].id;
  }, [userChilds]);

  const getTopPercent = (value: number, data: GrowthPercentileData, month: number): number | null => {
    const values = PERCENTILES.map((p) => ({
      rank: p.rank,
      value: getNearestValue(data[p.key] ?? [], month),
    }));
    const percentile = estimatePercentile(value, values);
    if (percentile === null) return null;
    return Math.max(0, 100 - percentile);
  };

  const canSubmitReport =
    isValidMonths &&
    isValidHeight &&
    isValidWeight &&
    requestedMonth !== null &&
    hasGrowthData &&
    defaultChildId !== null &&
    !createGrowthReportsMutation.isPending;

  const doSave = async (childId: number) => {
    const monthValue = parsedMonths;
    const heightPercent = getTopPercent(parsedHeight, heightData, monthValue);
    const weightPercent = getTopPercent(parsedWeight, weightData, monthValue);
    const headerPercent = isValidHeader ? getTopPercent(parsedHeader, headerData, monthValue) : null;

    if (heightPercent === null || weightPercent === null) {
      toastError('분포 퍼센트를 계산할 수 없습니다. 다시 시도해주세요.');
      return;
    }

    const reports: Array<{ type: 'height' | 'weight' | 'head'; months: number; value: number; percent: number }> = [
      {
        type: 'height',
        months: monthValue,
        value: parsedHeight,
        percent: Number(heightPercent.toFixed(1)),
      },
      {
        type: 'weight',
        months: monthValue,
        value: parsedWeight,
        percent: Number(weightPercent.toFixed(1)),
      },
    ];

    if (isValidHeader && headerPercent !== null) {
      reports.push({
        type: 'head',
        months: monthValue,
        value: parsedHeader,
        percent: Number(headerPercent.toFixed(1)),
      });
    }

    try {
      const response = await createGrowthReportsMutation.mutateAsync({
        childId,
        payload: { reports },
      });

      if (response.success) {
        toastSuccess('성장 기록이 저장되었습니다.');
      } else {
        toastError(response.error || '성장 기록 저장에 실패했습니다.');
      }
    } catch (error: any) {
      toastError(error?.message || '성장 기록 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSaveGrowthReport = () => {
    if (!canSubmitReport) {
      toastError('개월수, 키, 체중을 입력하고 또래 분포를 먼저 조회해주세요.');
      return;
    }
    if (hasMultipleChildren) {
      setChildSelectVisible(true);
    } else {
      doSave(defaultChildId!);
    }
  };

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
                  <Text style={styles.fieldLabel}>아이 개월수</Text>
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
                  <Text style={styles.fieldLabel}>아이 키(cm)</Text>
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
                  <Text style={styles.fieldLabel}>아이 체중(kg)</Text>
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

            <GrowthChildSelectModal
              visible={childSelectVisible}
              children={userChilds as any}
              onSelect={(childId) => {
                setChildSelectVisible(false);
                doSave(childId);
              }}
              onClose={() => setChildSelectVisible(false)}
            />

            <TouchableOpacity onPress={handleSaveGrowthReport} activeOpacity={0.85}>
              <LinearGradient
                colors={canSubmitReport ? ['#73C8A9', '#57B38F'] : ['#DDD', '#CCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.recordBtn}
              >
                {createGrowthReportsMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="save-outline" size={18} color="#FFF" />
                )}
                <Text style={styles.searchBtnText}>
                  {createGrowthReportsMutation.isPending ? '저장 중...' : '우리아이 성장 기록하기'}
                </Text>
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
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
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
});
