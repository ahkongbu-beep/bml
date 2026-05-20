
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import styles from '../styles/screens/GrowthReportScreen.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Layout from '@/components/Layout';
import Header from '../components/Header';
import { useAuth } from '../libs/contexts/AuthContext';
import { useGetGrowthReports } from '../libs/hooks/useGrowths';
import { GrowthReportRecord } from '../libs/api/growthApi';
import { TYPE_META } from '../libs/utils/codes/GrowthCode';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

interface DateGroup {
  date: string;
  items: GrowthReportRecord[];
}

function groupByDate(records: GrowthReportRecord[]): DateGroup[] {
  const map = new Map<string, GrowthReportRecord[]>();
  for (const r of records) {
    const key = r.created_at.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function RecordRow({ item }: { item: GrowthReportRecord }) {
  const meta = TYPE_META[item.type] ?? { label: item.type, unit: '', icon: 'stats-chart-outline', color: '#888', bg: '#F5F5F5' };
  const topPercent = parseFloat(item.percent);

  return (
    <View style={styles.recordRow}>
      <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon as any} size={18} color={meta.color} />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordLabel}>{meta.label}</Text>
        <Text style={styles.recordMonths}>{item.months}개월</Text>
      </View>
      <Text style={[styles.recordValue, { color: meta.color }]}>
        {item.value}{meta.unit}
      </Text>
      {!isNaN(topPercent) && (
        <View style={[styles.percentBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.percentText, { color: meta.color }]}>상위 {topPercent.toFixed(1)}%</Text>
        </View>
      )}
    </View>
  );
}

function DateCard({ group }: { group: DateGroup }) {
  const typeOrder = ['height', 'weight', 'head'];
  const sorted = [...group.items].sort(
    (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type),
  );

  return (
    <View style={styles.dateCard}>
      <View style={styles.dateHeader}>
        <View style={styles.dateDot} />
        <Text style={styles.dateText}>{formatDate(group.date)}</Text>
      </View>
      {sorted.map((item) => (
        <RecordRow key={item.id} item={item} />
      ))}
    </View>
  );
}

export default function GrowthReportScreen({ navigation }: any) {
  const { user } = useAuth();
  const userChilds = user?.user_childs ?? [];
  const hasMultipleChildren = userChilds.length > 1;

  const defaultChild = useMemo(() => {
    if (!userChilds.length) return null;
    return userChilds.find((c) => c.is_agent === 'Y') ?? userChilds[0];
  }, [userChilds]);

  const [selectedChildId, setSelectedChildId] = useState<number | null>(defaultChild?.id ?? null);

  const { data, isLoading, isError } = useGetGrowthReports(selectedChildId);

  const groups = useMemo(() => {
    if (!data?.success || !data.data) return [];
    return groupByDate(data.data);
  }, [data]);

  const selectedChild = userChilds.find((c) => c.id === selectedChildId);

  return (
    <Layout>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <Header
          title="성장 리포트"
          leftButton={{ icon: 'arrow-back', onPress: () => navigation.goBack() }}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 자녀 선택 탭 */}
          {hasMultipleChildren && (
            <View style={styles.childTabRow}>
              {userChilds.map((child) => {
                const active = child.id === selectedChildId;
                const isMale = child.child_gender === 'M';
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childTab,
                      active && (isMale ? styles.childTabActiveM : styles.childTabActiveW),
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedChildId(child.id)}
                  >
                    <Text style={[styles.childTabText, active && styles.childTabTextActive]}>
                      {child.child_name}
                    </Text>
                    {child.is_agent === 'Y' && (
                      <View style={styles.agentDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 선택된 아이 정보 배너 */}
          {selectedChild && (
            <View style={styles.childBanner}>
              <View style={[
                styles.childGenderBadge,
                selectedChild.child_gender === 'M' ? styles.genderM : styles.genderW,
              ]}>
                <Text style={styles.childGenderText}>
                  {selectedChild.child_gender === 'M' ? '남' : '여'}
                </Text>
              </View>
              <View>
                <Text style={styles.childBannerName}>{selectedChild.child_name}</Text>
                <Text style={styles.childBannerBirth}>{selectedChild.child_birth} 출생</Text>
              </View>
            </View>
          )}

          {/* 로딩 */}
          {isLoading && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#FF7B89" />
              <Text style={styles.centerText}>성장 기록을 불러오는 중...</Text>
            </View>
          )}

          {/* 에러 */}
          {isError && !isLoading && (
            <View style={styles.centerBox}>
              <Ionicons name="alert-circle-outline" size={40} color="#FFB6C1" />
              <Text style={styles.centerText}>데이터를 불러오지 못했습니다.</Text>
            </View>
          )}

          {/* 빈 상태 */}
          {!isLoading && !isError && groups.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="document-outline" size={52} color="#FFCDD5" />
              <Text style={styles.emptyTitle}>아직 성장 기록이 없어요</Text>
              <Text style={styles.emptyDesc}>
                또래 성장 분포 조회 화면에서{'\n'}성장 기록을 추가해보세요.
              </Text>
              <TouchableOpacity
                style={styles.goRecordBtn}
                onPress={() => navigation.navigate('Growth')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FF7B89" />
                <Text style={styles.goRecordText}>성장 기록하러 가기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 리포트 목록 */}
          {!isLoading && !isError && groups.length > 0 && (
            <View style={styles.timeline}>
              {groups.map((g) => (
                <DateCard key={g.date} group={g} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
}

