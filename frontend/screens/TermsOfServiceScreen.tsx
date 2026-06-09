import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { setConsentPending } from '../libs/utils/consentPending';

const TERMS = {
	title: '배밀이 서비스 이용약관 (Baby Meal List)',
	effectiveDate: '최종 시행일: 2026년 5월 28일',
	sections: [
		{
			title: '제1조 (목적)',
			items: [
				'본 약관은 배밀이(Baby Meal List)(이하 회사 또는 서비스)가 제공하는 모바일 애플리케이션 및 관련 서비스(이하 서비스)를 이용함에 있어, 회사와 이용자(이하 회원)의 권리, 의무 및 책임사항 등 필요한 사항을 규정함을 목적으로 합니다.',
			],
		},
		{
			title: '제2조 (용어의 정의)',
			items: [
				'1. 서비스: 회원이 모바일 기기를 통해 이용할 수 있는 배밀이(Baby Meal List) 앱 및 이와 관련된 제반 서비스를 의미합니다.',
				'2. 회원: 본 약관에 동의하고 회사와 이용계약을 체결하여 서비스를 이용하는 이용자를 말합니다.',
				'3. 콘텐츠: 회원이 서비스 내에 게시한 식단 이미지, 재료 정보, 성장발달 데이터, 게시글, 댓글 등 일체의 정보를 말합니다.',
				'4. AI 분석 서비스: 회원이 입력한 식단 재료 데이터를 기반으로 인공지능 알고리즘이 영양성분을 분석하여 정보를 제공하는 부가 기능을 의미합니다.',
			],
		},
		{
			title: '제3조 (약관의 명시와 개정)',
			items: [
				'1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 내 설정 화면 등에 게시합니다.',
				'2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.',
				'3. 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 현행 약관과 함께 서비스 내 공지사항을 통해 공지합니다. 적용일자 7일 전부터 공지하며, 회원에게 불리하거나 중대한 사항의 변경은 30일 전부터 공지합니다.',
			],
		},
		{
			title: '제4조 (이용계약 체결 및 회원가입)',
			items: [
				'1. 이용계약은 회원이 되고자 하는 자가 본 약관의 내용에 동의하고, 이메일 회원가입 또는 소셜 연동 로그인(구글, 네이버, 카카오)을 통해 가입 신청을 하며 회사가 이를 승낙함으로써 체결됩니다.',
				'2. 본 서비스는 보호자가 자녀의 정보를 기록·관리하는 서비스로, 만 14세 미만의 아동은 직접 회원가입을 할 수 없으며 보호자(법정대리인)의 계정을 통해 이용되어야 합니다.',
				'3. 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.',
				'- 타인의 명의나 이메일 정보를 도용하여 신청한 경우',
				'- 허위의 정보를 기재하거나 회사가 제시하는 내용을 기재하지 않은 경우',
			],
		},
	],
};

export default function TermsOfServiceScreen({ navigation, route }: any) {
	const insets = useSafeAreaInsets();
	const agreeType = route?.params?.agreeType as 'terms' | undefined;

	const handleConfirm = () => {
		if (agreeType) setConsentPending(agreeType);
		navigation.goBack();
	};

	return (
		<Layout>
			<View style={styles.container}>
				<Header
					title="이용약관"
					// leftButton={{
					// 	icon: 'arrow-back',
					// 	// onPress: () => navigation.goBack(),
					// }}
				/>

				<ScrollView
					style={styles.scroll}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingBottom: Math.max(insets.bottom + 24, 40) },
					]}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.topCard}>
						<Text style={styles.mainTitle}>{TERMS.title}</Text>
						<Text style={styles.effectiveDate}>{TERMS.effectiveDate}</Text>
					</View>

					{TERMS.sections.map((section) => (
						<View key={section.title} style={styles.sectionCard}>
							<Text style={styles.sectionTitle}>{section.title}</Text>
							{section.items.map((item, idx) => (
								<Text key={`${section.title}-${idx}`} style={styles.sectionItem}>
									{item}
								</Text>
							))}
						</View>
					))}
				</ScrollView>
				{agreeType && (
					<View style={[styles.confirmContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
						<TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
							<Text style={styles.confirmButtonText}>확인 및 동의</Text>
						</TouchableOpacity>
					</View>
				)}
			</View>
		</Layout>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFBF7',
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
	},
	topCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#FFE4E8',
		padding: 16,
		marginBottom: 12,
	},
	mainTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#3D3D3D',
		marginBottom: 8,
	},
	effectiveDate: {
		fontSize: 12,
		color: '#888888',
	},
	sectionCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#F4F4F4',
		padding: 16,
		marginBottom: 10,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#4A4A4A',
		marginBottom: 10,
	},
	sectionItem: {
		fontSize: 14,
		lineHeight: 22,
		color: '#5D5D5D',
		marginBottom: 8,
	},
	confirmContainer: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: '#F0F0F0',
		backgroundColor: '#FFFBF7',
	},
	confirmButton: {
		backgroundColor: '#FF8C00',
		borderRadius: 10,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
	},
	confirmButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#FFF',
	},
});