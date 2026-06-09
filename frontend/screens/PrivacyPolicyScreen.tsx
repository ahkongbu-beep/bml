import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Layout from '../components/Layout';
import Header from '../components/Header';
import { setConsentPending } from '../libs/utils/consentPending';

const POLICY = {
	title: '개인정보처리방침',
	revisedAt: '최종 수정일: 2026년 5월 28일',
	intro:
		'배밀이(Baby Meal List)(이하 회사 또는 서비스)는 이용자의 개인정보를 중요하게 생각하며 개인정보 보호법 등 관련 법령을 준수합니다. 본 개인정보처리방침을 통해 이용자가 제공한 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치를 취하고 있는지 안내드립니다.',
	sections: [
		{
			title: '1. 수집하는 개인정보 항목 및 수집 방법',
			items: [
				'회원가입 및 로그인 시',
				'- 이메일 회원가입: 이메일 주소, 비밀번호, 닉네임',
				'- 소셜 연동 로그인(구글, 카카오): 플랫폼 식별자(ID), 이메일 주소, 프로필 정보(닉네임, 프로필 이미지)',
				'서비스 이용 및 프로필 설정 시(자녀 정보 포함)',
				'- 자녀 프로필 정보: 자녀 별명 또는 이름, 프로필 이미지, 생년월일, 성별',
				'- 성장발달 기록 데이터: 개월 수, 키, 체중, 머리둘레',
				'- 식단 및 AI 분석 데이터: 식단 기록(음식/식단 이미지), 재료 텍스트, 식단 캘린더 등록 데이터',
				'- 커뮤니티 이용 데이터: 공유 카테고리, 게시글/댓글, 사진 파일 메타데이터(선택 시)',
				'서비스 이용 과정에서 자동 수집되는 항목',
				'- IP 주소, 쿠키(Cookie), 방문 일시, 서비스 이용 기록, 불량 이용 기록, 기기 정보(OS 버전, 디바이스 모델명)',
				'중요 안내(건강/알레르기 정보)',
				'- 맞춤형 식단 관리 기능 제공을 위해 자녀 알레르기 정보를 수집할 수 있으며, 이는 민감정보에 해당할 수 있어 별도의 명시적 동의를 받습니다.',
			],
		},
		{
			title: '2. 개인정보의 수집 및 이용 목적',
			items: [
				'- 회원관리: 회원가입 의사 확인, 이용자 식별/본인확인, 회원자격 유지·관리, 부정이용 방지, 만 14세 미만 여부 확인',
				'- 서비스 제공 및 운영: 자녀별 식단 이미지 기록/캘린더 기능 제공',
				'- AI 분석: 등록된 식단 재료 기반 영양성분 분석 및 결과 제공',
				'- 커뮤니티 운영: 식단 공유 카테고리 및 게시판 운영',
				'- 성장 리포트: 개월수·키·체중·머리둘레 기록 통계 및 시각화 제공',
				'- 고객지원/기능개발: 문의 처리, 서비스 안정성 확보, 서비스 개선 및 신규 기능 개발',
			],
		},
		{
			title: '3. 개인정보의 보유 및 이용기간',
			items: [
				'원칙적으로 개인정보의 수집·이용 목적이 달성되면 지체 없이 파기합니다.',
				'다만, 관련 법령에 따라 보존이 필요한 경우에는 법령이 정한 기간 동안 보관합니다.',
			],
		},
		{
			title: '4. 만 14세 미만 아동의 개인정보 보호',
			items: [
				'본 서비스는 보호자(법정대리인)가 자녀의 식단 및 성장 발달을 기록·관리하는 서비스입니다.',
				'회사는 만 14세 미만 아동의 개인정보를 직접 수집하지 않으며, 자녀 정보는 보호자가 자발적으로 등록·관리합니다.',
				'보호자는 언제든지 등록된 자녀 개인정보를 열람, 수정, 삭제할 수 있습니다.',
			],
		},
		{
			title: '5. 개인정보 처리 위탁',
			items: [
				'원활한 서비스 제공을 위해 일부 개인정보 처리 업무를 외부 전문업체에 위탁할 수 있습니다.',
				'예시 수탁업체: Google Cloud, Firebase, Amazon Web Services, OpenAI',
				'위탁 업무: 인프라 운영, 데이터 보관, AI 식단 재료 영양성분 분석',
				'위탁 기간: 회원 탈퇴 시 또는 위탁 계약 종료 시까지',
				'법정 보관 예시: 분쟁처리기록 3년, 접속로그 3개월, 계약/청약철회 기록 5년',
			],
		},
		{
			title: '6. 이용자의 권리·의무 및 행사방법',
			items: [
				'개인정보 열람/정정 요구: 앱 내 설정 또는 프로필 관리 메뉴를 통해 가능',
				'개인정보 삭제/회원 탈퇴: 앱 내 탈퇴 기능을 통해 요청 가능',
				'처리정지 요구: 회사의 개인정보 처리에 대해 일시적 정지를 요구할 수 있음',
			],
		},
		{
			title: '7. 개인정보의 파기절차 및 방법',
			items: [
				'파기 절차: 목적 달성 후 내부 방침 및 법령에 따라 즉시 또는 일정 기간 후 파기',
				'파기 방법: 전자파일은 복구 불가능한 기술로 삭제, 출력물은 분쇄 또는 소각',
			],
		},
		{
			title: '8. 개인정보 보호책임자 및 상담 안내',
			items: [
				'개인정보 보호책임자/담당부서: 조상현',
				'이메일: bml@gmail.co.kr',
			],
		},
		{
			title: '9. 개인정보처리방침의 변경',
			items: [
				'정책, 보안기술, 서비스 스펙 변경 등에 따라 본 방침은 변경될 수 있습니다.',
				'개정 시 변경사항은 시행 최소 30일 전(중요사항은 7일 전) 앱 내 공지사항을 통해 고지합니다.',
			],
		},
	],
};

export default function PrivacyPolicyScreen({ navigation, route }: any) {
	const insets = useSafeAreaInsets();
	const agreeType = route?.params?.agreeType as 'privacy' | undefined;

	const handleConfirm = () => {
		if (agreeType) setConsentPending(agreeType);
		navigation.goBack();
	};

	return (
		<Layout>
			<View style={styles.container}>
				<Header
					title="개인정보처리방침"
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
						<Text style={styles.mainTitle}>{POLICY.title}</Text>
						<Text style={styles.revisedAt}>{POLICY.revisedAt}</Text>
						<Text style={styles.intro}>{POLICY.intro}</Text>
					</View>

					{POLICY.sections.map((section) => (
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
		marginBottom: 6,
	},
	revisedAt: {
		fontSize: 12,
		color: '#888888',
		marginBottom: 10,
	},
	intro: {
		fontSize: 14,
		lineHeight: 22,
		color: '#5D5D5D',
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