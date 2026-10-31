import { useCallback, useEffect, useState, type SubmitEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { changeStaffPassword, getStaffSession, loginStaff, logoutStaff, uploadStaffProfileImage } from '../services/authService';
import { approveReport, getPendingReports } from '../services/reportService';
import type { StaffUser } from '../types/staff';
import { showError, showSuccess } from '../utils/notifications';

export function useStaffWorkspaceState() {
  const [api, setApi] = useState<'loading' | 'online' | 'offline'>('loading');
  const [user, setUser] = useState<StaffUser | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [nrpp, setNrpp] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileImageBusy, setProfileImageBusy] = useState(false);
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['staff-pending', user?.id, user?.role],
    enabled: user !== null,
    queryFn: getPendingReports,
  });
  const reports = pendingQuery.data ?? [];
  const refreshPending = useCallback(async () => { await pendingQuery.refetch(); }, [pendingQuery.refetch]);

  useEffect(() => {
    const controller = new AbortController();
    getStaffSession(controller.signal)
      .then((session) => {
        setApi('online');
        if (session) {
          setUser(session.user);
          setCsrfToken(session.csrfToken);
        }
      })
      .catch((caught: unknown) => {
        if (!(caught instanceof DOMException && caught.name === 'AbortError')) setApi('offline');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleUnauthenticated = () => {
      setUser(null);
      setCsrfToken('');
      setError('Sesi tidak valid atau telah berakhir. Silakan masuk kembali.');
      setNotice('');
    };
    window.addEventListener('dmar:unauthenticated', handleUnauthenticated);
    return () => window.removeEventListener('dmar:unauthenticated', handleUnauthenticated);
  }, []);

  useEffect(() => {
    if (pendingQuery.error) setError(pendingQuery.error.message);
  }, [pendingQuery.error]);

  async function signIn(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await loginStaff(nrpp, password, rememberMe);
      setUser(session.user);
      setCsrfToken(session.csrfToken);
      setPassword('');
      setApi('online');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Tidak dapat menghubungi server');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await logoutStaff(csrfToken);
      setUser(null);
      setCsrfToken('');
      setNotice('');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Logout gagal. Muat ulang halaman lalu coba lagi.');
    }
  }

  async function approve(id: number) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await approveReport(id, csrfToken);
      showSuccess('Laporan berhasil disetujui');
      await queryClient.invalidateQueries({ queryKey: ['staff-pending'] });
      await queryClient.invalidateQueries({ queryKey: ['foreman-approved'] });
    } catch (caught) {
      showError('Persetujuan laporan gagal', caught instanceof Error ? caught.message : 'Tidak dapat menyetujui laporan');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    setPasswordBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await changeStaffPassword(currentPassword, newPassword, csrfToken);
      setCsrfToken(result.csrfToken);
      showSuccess('Password berhasil diubah');
      return true;
    } catch (caught) {
      showError('Password gagal diubah', caught instanceof Error ? caught.message : 'Coba lagi.');
      return false;
    } finally {
      setPasswordBusy(false);
    }
  }

  async function uploadProfileImage(file: File): Promise<{ ok: boolean; message?: string }> {
    setProfileImageBusy(true);
    try {
      const result = await uploadStaffProfileImage(file, csrfToken);
      setUser((current) => current ? { ...current, profileImageUrl: result.profileImageUrl } : current);
      return { ok: true };
    } catch (caught) {
      return { ok: false, message: caught instanceof Error ? caught.message : 'Foto profil gagal disimpan. Silakan coba lagi.' };
    } finally {
      setProfileImageBusy(false);
    }
  }

  return {
    api, user, csrfToken, nrpp, password, rememberMe, error, notice, busy, passwordBusy, profileImageBusy, reports,
    pendingLoading: pendingQuery.isLoading,
    pendingRefreshing: pendingQuery.isFetching,
    setNrpp, setPassword, setRememberMe, signIn, signOut, approve, refreshPending, changePassword, uploadProfileImage,
  };
}
