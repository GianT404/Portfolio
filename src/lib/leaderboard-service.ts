// Leaderboard Service - Quản lý điểm số Snake Game với Firebase Firestore
import { 
  collection, 
  addDoc, 
  query, 
  where,
  orderBy, 
  limit, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Interface cho LeaderboardEntry
export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

// Interface cho Firestore document
interface FirestoreLeaderboardEntry {
  name: string;
  score: number;
  createdAt: Timestamp;
}

/**
 * Lưu điểm số mới vào Firestore
 * @param name - Tên người chơi
 * @param score - Điểm số đạt được
 * @returns Promise với document reference hoặc null nếu lỗi
 */
export async function saveScore(name: string, score: number): Promise<boolean> {
  try {
    // Validate input
    if (!name.trim() || score < 0) {
      console.error('Invalid input: name hoặc score không hợp lệ');
      return false;
    }

    // Luôn thêm document mới - lưu tất cả lần chơi của user
    await addDoc(collection(db, 'snakeLeaderboard'), {
      name: name.trim(),
      score: score,
      createdAt: serverTimestamp(), // Tự động lấy thời gian server
    });

    console.log('✅ Đã lưu điểm thành công:', { name, score });
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi lưu điểm vào Firebase:', error);
    return false;
  }
}

/**
 * Lấy danh sách top 5 điểm cao nhất từ Firestore
 * @returns Promise với mảng LeaderboardEntry (top 5)
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    // Tạo query: chỉ sắp xếp theo score để tránh lỗi composite index
    const leaderboardQuery = query(
      collection(db, 'snakeLeaderboard'),
      orderBy('score', 'desc'),
      limit(5)
    );

    // Thực hiện query
    const querySnapshot = await getDocs(leaderboardQuery);

    // Chuyển đổi dữ liệu Firestore thành LeaderboardEntry[]
    const leaderboard: LeaderboardEntry[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreLeaderboardEntry;
      return {
        name: data.name,
        score: data.score,
        date: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    console.log(`✅ Đã tải ${leaderboard.length} records từ Firebase`);
    return leaderboard;
  } catch (error) {
    console.error('❌ Lỗi khi tải leaderboard từ Firebase:', error);
    return [];
  }
}

/**
 * Lấy tất cả điểm số của một người chơi cụ thể
 * @param playerName - Tên người chơi
 * @returns Promise với mảng tất cả điểm của người chơi đó
 */
export async function getUserScores(playerName: string): Promise<LeaderboardEntry[]> {
  try {
    if (!playerName.trim()) {
      return [];
    }

    // Query tất cả scores của user, sắp xếp theo thời gian mới nhất
    const userScoresQuery = query(
      collection(db, 'snakeLeaderboard'),
      where('name', '==', playerName.trim()),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(userScoresQuery);

    const userScores: LeaderboardEntry[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as FirestoreLeaderboardEntry;
      return {
        name: data.name,
        score: data.score,
        date: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    console.log(`✅ Đã tải ${userScores.length} scores của ${playerName}`);
    return userScores;
  } catch (error) {
    console.error('❌ Lỗi khi tải scores của user:', error);
    return [];
  }
}

/**
 * Lấy thống kê của một người chơi
 * @param playerName - Tên người chơi
 * @returns Promise với thống kê người chơi
 */
export async function getUserStats(playerName: string): Promise<{
  totalGames: number;
  highestScore: number;
  averageScore: number;
  lastPlayed: string;
}> {
  try {
    const userScores = await getUserScores(playerName);
    
    if (userScores.length === 0) {
      return {
        totalGames: 0,
        highestScore: 0,
        averageScore: 0,
        lastPlayed: '',
      };
    }

    const scores = userScores.map(entry => entry.score);
    const totalGames = scores.length;
    const highestScore = Math.max(...scores);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / totalGames);
    const lastPlayed = userScores[0].date; // Đã sort theo thời gian desc

    return {
      totalGames,
      highestScore,
      averageScore,
      lastPlayed,
    };
  } catch (error) {
    console.error('❌ Lỗi khi tính thống kê user:', error);
    return {
      totalGames: 0,
      highestScore: 0,
      averageScore: 0,
      lastPlayed: '',
    };
  }
}

/**
 * Xóa toàn bộ leaderboard (dùng cho admin)
 * Chú ý: Cần cấu hình Firebase Security Rules để bảo vệ
 */
export async function clearLeaderboard(): Promise<boolean> {
  try {
    const querySnapshot = await getDocs(collection(db, 'snakeLeaderboard'));
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log('✅ Đã xóa toàn bộ leaderboard');
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi xóa leaderboard:', error);
    return false;
  }
}
