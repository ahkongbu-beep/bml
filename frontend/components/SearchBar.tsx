
import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MEAL_STAGE } from '../libs/utils/codes/MealState';

interface SearchBarProps {
  onSearch?: (
    query: string,
    mealStage: number,
    mealStageDetail: string,
  ) => void;
}

const mealStageRanges = [
	{ label: '전체', value: 0 },
];

if (MEAL_STAGE && Array.isArray(MEAL_STAGE)) {
  MEAL_STAGE.forEach(stage => {
    mealStageRanges.push({ label: stage.label, value: stage.id });
  });
}

export default function SearchBar({ onSearch }: SearchBarProps) {
	const [query, setQuery] = useState('');
	const [selectedMealStage, setSelectedMealStage] = useState<number>(0);
  const [selectedMealStageDetail, setSelectedMealStageDetail] = useState<string>('');
  const selectedStage = MEAL_STAGE.find(
      stage => stage.id === selectedMealStage
  );

  const stageItems = Array.isArray(selectedStage?.items)
      ? selectedStage.items
      : [];

  useEffect(() => {
    onSearch?.(query, selectedMealStage, selectedMealStageDetail);
  }, [query, selectedMealStage, selectedMealStageDetail]);

	return (
		<View style={styles.container}>
			<View style={styles.mealStageContainer}>
				{mealStageRanges.map((range) => (
					<TouchableOpacity
						key={range.value}
						style={[
							styles.mealStageButton,
							selectedMealStage === range.value && styles.mealStageButtonSelected,
						]}
						onPress={() => setSelectedMealStage(range.value)}
					>
						<Text
							style={[
								styles.mealStageButtonText,
								selectedMealStage === range.value && styles.mealStageButtonTextSelected,
							]}
						>
							{range.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		padding: 12,
		backgroundColor: '#fff',
		borderRadius: 8,
		marginBottom: 8,
		elevation: 2,
	},
	input: {
		height: 40,
		borderColor: '#ddd',
		borderWidth: 1,
		borderRadius: 6,
		paddingHorizontal: 10,
		marginBottom: 8,
		fontSize: 16,
		backgroundColor: '#fafafa',
	},
	mealStageContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		gap: 8,
	},
	mealStageButton: {
		paddingVertical: 6,
		paddingHorizontal: 14,
		borderRadius: 16,
		backgroundColor: '#eee',
		marginRight: 8,
	},
	mealStageButtonSelected: {
		backgroundColor: '#FF9AA2',
	},
	mealStageButtonText: {
		color: '#888',
		fontWeight: 'bold',
	},
	mealStageButtonTextSelected: {
		color: '#fff',
	},
  detailContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },

  detailButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFE5E8',
  },

  detailText: {
    color: '#FF6B7A',
    fontWeight: '600',
  },
});
