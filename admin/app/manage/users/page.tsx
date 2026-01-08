"use client";

import { useEffect, useState } from 'react';
import { useUsers } from '@/hooks/useUsers';
import { User, UserSearchParams } from '@/libs/interface/users';
import toast from 'react-hot-toast';
import Pager from '@/components/pager';
import UserDetailModal from '@/components/manage/modals/UserDetailModal';

export default function UsersManagePage() {
  const { users, total, currentPage, totalPages, loading, fetchUsers, updateUserStatus, resetPassword } = useUsers();

  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    sns_id: '',
    name: '',
    nickname: '',
    page: 1,
    limit: 20,
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadUsers = async (params?: UserSearchParams) => {
    try {
      const finalParams = params || searchParams;
      await fetchUsers(finalParams);
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원 목록을 불러오는데 실패했습니다.';
      toast.error(message);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = { ...searchParams, page: 1 };
    setSearchParams(params);
    loadUsers(params);
  };

  const handleReset = () => {
    const resetParams: UserSearchParams = {
      sns_id: '',
      name: '',
      nickname: '',
      page: 1,
      limit: 20,
    };
    setSearchParams(resetParams);
    loadUsers(resetParams);
  };

  const handlePageChange = (page: number) => {
    const params = { ...searchParams, page };
    setSearchParams(params);
    loadUsers(params);
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.is_active === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? '활성화' : '비활성화';

    if (!confirm(`${user.name}(${user.nickname}) 회원을 ${statusText} 하시겠습니까?`)) {
      return;
    }

    try {
      await updateUserStatus({ view_hash: user.view_hash, is_active: newStatus });
      toast.success(`회원이 ${statusText} 되었습니다.`);
      loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : '상태 변경에 실패했습니다.';
      toast.error(message);
    }
  };

  const handlePasswordReset = async (user: User) => {
    if (user.sns_login_type !== 'EMAIL') {
      toast.error('EMAIL 로그인 회원만 비밀번호 초기화가 가능합니다.');
      return;
    }

    if (!confirm(`${user.name}(${user.nickname}) 회원의 비밀번호를 초기화 하시겠습니까?\n초기 비밀번호는 "reset1234" 입니다.`)) {
      return;
    }

    try {
      const result = await resetPassword({ view_hash: user.view_hash });
      toast.success(result.message || '비밀번호가 초기화되었습니다.');
      setIsDetailModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '비밀번호 초기화에 실패했습니다.';
      toast.error(message);
    }
  };

  const handleOpenDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedUser(null);
    setIsDetailModalOpen(false);
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

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">회원 관리</h2>
          <p className="text-sm md:text-base text-gray-400">회원 정보를 조회하고 관리합니다</p>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">검색 필터</h3>
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SNS ID</label>
              <input
                type="text"
                value={searchParams.sns_id || ''}
                onChange={(e) => setSearchParams({ ...searchParams, sns_id: e.target.value })}
                placeholder="SNS ID 검색"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">이름</label>
              <input
                type="text"
                value={searchParams.name || ''}
                onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
                placeholder="이름 검색"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">닉네임</label>
              <input
                type="text"
                value={searchParams.nickname || ''}
                onChange={(e) => setSearchParams({ ...searchParams, nickname: e.target.value })}
                placeholder="닉네임 검색"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? '검색 중...' : '검색'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              초기화
            </button>
          </div>
        </form>
      </div>

      {/* 회원 목록 */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">로그인타입</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">이름</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">닉네임</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">이메일</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">전화번호</th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">가입일<br/>최근접속</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
                <th className="px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-400">
                    검색 결과가 없습니다
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.view_hash} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-indigo-600/20 text-indigo-400 rounded-full">
                        {getSnsLoginTypeLabel(user.sns_login_type)}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-300">{user.nickname}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-300">{user.email}</td>
                    <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-300">{user.phone}</td>

                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>{formatDateTime(user.created_at)}</div>
                      <div>{formatDateTime(user.last_login_at)}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          user.is_active === 1
                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                            : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'
                        }`}
                      >
                        {user.is_active === 1 ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleOpenDetail(user)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        {totalPages > 0 && (
          <div className="px-4 py-4 border-t border-gray-800">
            <Pager
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      {total > 0 && (
        <div className="mt-4 text-sm text-gray-400 text-center">
          총 <span className="font-semibold text-indigo-400">{total}</span>명의 회원
        </div>
      )}

      {/* 상세보기 모달 */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          onStatusToggle={handleStatusToggle}
          onPasswordReset={handlePasswordReset}
        />
      )}
    </div>
  );
}
