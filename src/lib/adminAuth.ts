// Admin password management service
import { database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

// Interface cho admin config
interface AdminConfig {
  passwordHash: string;
  lastUpdated: number;
  attempts: number;
  lastAttempt: number;
}

// Simple hash function cho password (trong production nên dùng bcrypt)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36) + password.length.toString(36);
};

// Kiểm tra xem admin đã được thiết lập chưa
export const checkAdminExists = async (): Promise<boolean> => {
  try {
    const adminRef = ref(database, 'admin/config');
    const snapshot = await get(adminRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Lỗi kiểm tra admin:', error);
    return false;
  }
};

// Thiết lập mật khẩu admin lần đầu
export const setupInitialPassword = async (password: string): Promise<{ success: boolean; message: string }> => {
  try {
    const adminExists = await checkAdminExists();
    if (adminExists) {
      return { success: false, message: 'Admin đã được thiết lập trước đó' };
    }

    // Validate mật khẩu
    if (password.length < 6) {
      return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
    }

    const initialConfig: AdminConfig = {
      passwordHash: hashPassword(password),
      lastUpdated: Date.now(),
      attempts: 0,
      lastAttempt: 0
    };
    
    const adminRef = ref(database, 'admin/config');
    await set(adminRef, initialConfig);
    
    return { success: true, message: 'Thiết lập mật khẩu admin thành công' };
  } catch (error) {
    console.error('Lỗi thiết lập mật khẩu admin:', error);
    return { success: false, message: 'Có lỗi xảy ra khi thiết lập mật khẩu' };
  }
};

// Xác thực mật khẩu admin
export const validateAdminPassword = async (password: string): Promise<boolean> => {
  try {
    const adminRef = ref(database, 'admin/config');
    const snapshot = await get(adminRef);
    
    if (!snapshot.exists()) {
      // Không có admin được thiết lập
      return false;
    }
    
    const config: AdminConfig = snapshot.val();
    const hashedInput = hashPassword(password);
    
    // Cập nhật số lần thử
    await set(ref(database, 'admin/config/attempts'), config.attempts + 1);
    await set(ref(database, 'admin/config/lastAttempt'), Date.now());
    
    return hashedInput === config.passwordHash;
  } catch (error) {
    console.error('Lỗi xác thực mật khẩu:', error);
    return false;
  }
};

// Thay đổi mật khẩu admin
export const changeAdminPassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Kiểm tra mật khẩu cũ
    const isValidOldPassword = await validateAdminPassword(oldPassword);
    if (!isValidOldPassword) {
      return { success: false, message: 'Mật khẩu cũ không đúng' };
    }
    
    // Validate mật khẩu mới
    if (newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }
    
    // Cập nhật mật khẩu mới
    const newConfig: AdminConfig = {
      passwordHash: hashPassword(newPassword),
      lastUpdated: Date.now(),
      attempts: 0,
      lastAttempt: 0
    };
    
    const adminRef = ref(database, 'admin/config');
    await set(adminRef, newConfig);
    
    return { success: true, message: 'Mật khẩu đã được thay đổi thành công' };
  } catch (error) {
    console.error('Lỗi thay đổi mật khẩu:', error);
    return { success: false, message: 'Có lỗi xảy ra khi thay đổi mật khẩu' };
  }
};

// Lấy thông tin admin stats
export const getAdminStats = async (): Promise<{ attempts: number; lastAttempt: number; lastUpdated: number } | null> => {
  try {
    const adminRef = ref(database, 'admin/config');
    const snapshot = await get(adminRef);
    
    if (snapshot.exists()) {
      const config: AdminConfig = snapshot.val();
      return {
        attempts: config.attempts || 0,
        lastAttempt: config.lastAttempt || 0,
        lastUpdated: config.lastUpdated || 0
      };
    }
    return null;
  } catch (error) {
    console.error('Lỗi lấy thông tin admin:', error);
    return null;
  }
};

// Reset attempts counter
export const resetAdminAttempts = async (): Promise<void> => {
  try {
    await set(ref(database, 'admin/config/attempts'), 0);
    await set(ref(database, 'admin/config/lastAttempt'), 0);
  } catch (error) {
    console.error('Lỗi reset attempts:', error);
  }
};