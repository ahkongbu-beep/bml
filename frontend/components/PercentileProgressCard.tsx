import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GrowthPercentileData, GrowthPoint } from '../libs/types/GrowthTypes';
import { PERCENTILES } from '../libs/utils/codes/GrowthCode';

export function getNearestValue(points: GrowthPoint[], month: number): number | null {
  if (!Array.isArray(points) || points.length === 0) return null;
  const nearest = [...points].sort(
    (a, b) => Math.abs(a.months - month) - Math.abs(b.months - month),
  )[0];
  return nearest?.value ?? null;
}

export function estimatePercentile(
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

interface Props {
  title: string;
  unit: string;
  data: GrowthPercentileData;
  month: number;
  myValue: number | null;
}

export default function PercentileProgressCard({ title, unit, data, month, myValue }: Props) {
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
              <View key={item.key} style={[styles.marker, { left: `${item.rank}%` }]}>
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
                현재 우리아이는 또래 대비 상위 {myTopPercent.toFixed(1)}% 수준입니다.
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#4A4A4A' },
  emptyText: { fontSize: 13, color: '#999' },
  progressWrap: {
    marginTop: 6,
    marginBottom: 6,
    paddingTop: 22,
    paddingHorizontal: 2,
  },
  progressBar: { height: 12, borderRadius: 8 },
  marker: {
    position: 'absolute',
    top: 0,
    marginLeft: -8,
    alignItems: 'center',
  },
  markerRank: { fontSize: 10, color: '#777', fontWeight: '600' },
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
  myMarkerIcon: { marginTop: 2 },
  guideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 6,
  },
  guideText: { fontSize: 11, color: '#8A8A8A', fontWeight: '600' },
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
  rankLabel: { fontSize: 12, color: '#666' },
  rankValue: { fontSize: 13, color: '#333', fontWeight: '700' },
  mySummaryBox: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FFD8DF',
  },
  mySummaryText: { fontSize: 12, color: '#6B4C52', fontWeight: '600' },
});
