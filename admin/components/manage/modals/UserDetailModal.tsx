/**
 * 회원 상세보기 모달
 */
import { User } from '@/libs/interface/users';
import toast from 'react-hot-toast';

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onStatusToggle: (user: User) => Promise<void>;
  onPasswordReset: (user: User) => Promise<void>;
}

export default function UserDetailModal({
  user,
  isOpen,
  onClose,
  onStatusToggle,
  onPasswordReset,
}: UserDetailModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getSnsLoginTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EMAIL: '이메일',
      KAKAO: '카카오',
      NAVER: '네이버',
      GOOGLE: '구글',
    };
    return labels[type] || type;
  };

  const handleStatusToggle = async () => {
    try {
      await onStatusToggle(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : '상태 변경에 실패했습니다.';
      toast.error(message);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await onPasswordReset(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : '비밀번호 초기화에 실패했습니다.';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">회원 상세 정보</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">기본 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">로그인 타입</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  <span className="px-3 py-1 text-xs font-medium bg-indigo-600/20 text-indigo-400 rounded-full">
                    {getSnsLoginTypeLabel(user.sns_login_type)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">SNS ID</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">{user.sns_id || '-'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">이름</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white font-medium">{user.name}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">닉네임</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">{user.nickname}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">이메일</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">{user.email}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">전화번호</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">{user.phone}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">권한</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    user.role === 'ADMIN'
                      ? 'bg-red-600/20 text-red-400'
                      : 'bg-blue-600/20 text-blue-400'
                  }`}>
                    {user.role === 'ADMIN' ? '관리자' : '일반회원'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">상태</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <button
                    onClick={handleStatusToggle}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      user.is_active === 1
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                    }`}
                  >
                    {user.is_active === 1 ? '활성' : '비활성'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 자녀 정보 */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">자녀 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">자녀 생년월일</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  {formatDate(user.child_birth)}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">자녀 성별</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  {user.child_gender === 'M' ? '남자' : '여자'}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">연령 그룹</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  {user.child_age_group || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">추가 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">주소</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">{user.address || '-'}</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">프로필 이미지</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white text-xs truncate">
                  {user.profile_image || '-'}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">소개글</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white min-h-[60px]">
                  {user.description || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 동의 정보 */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">동의 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">마케팅 수신 동의</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    user.marketing_agree === 1
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    {user.marketing_agree === 1 ? '동의' : '미동의'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">푸시 알림 동의</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    user.push_agree === 1
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    {user.push_agree === 1 ? '동의' : '미동의'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 활동 정보 */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">활동 정보</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">가입일</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  {formatDateTime(user.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">최근 수정일</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  {formatDateTime(user.updated_at)}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">최근 접속일</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  {formatDateTime(user.last_login_at)}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">탈퇴일</label>
                <div className="bg-gray-800 rounded-lg px-4 py-2 text-white">
                  {user.deleted_at ? formatDateTime(user.deleted_at) : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 관리 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {user.sns_login_type === 'EMAIL' && (
              <button
                onClick={handlePasswordReset}
                className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors"
              >
                비밀번호 초기화
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
