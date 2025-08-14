import { SessionData, ManagerPair, RatingEntry, ImportResult } from '@/types';

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Session management
  async createSession(fullName: string): Promise<SessionData> {
    return this.request('/session', {
      method: 'POST',
      body: JSON.stringify({ fullName }),
    });
  }

  // Pairing and voting
  async getNextPair(token: string): Promise<{
    left?: Manager;
    right?: Manager;
    completed?: boolean;
    progress: {
      done: number;
      target: number;
      left: number;
      percentage: number;
    };
  }> {
    return this.request('/pair', {
      headers: this.getAuthHeaders(token),
    });
  }

  async submitVote(
    token: string,
    leftId: string,
    rightId: string,
    winnerId: string
  ): Promise<{
    ok: boolean;
    nextPair?: ManagerPair | null;
    progress: {
      done: number;
      target: number;
      left: number;
      percentage: number;
    };
  }> {
    return this.request('/vote', {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({ leftId, rightId, winnerId }),
    });
  }

  // Rankings
  async getPersonalRanking(token: string): Promise<RatingEntry[]> {
    return this.request('/ranking/self', {
      headers: this.getAuthHeaders(token),
    });
  }

  async getCompanyRanking(): Promise<RatingEntry[]> {
    return this.request('/ranking/company');
  }

  // Admin functions
  async importCsv(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/import`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async recomputeRatings(): Promise<{ success: boolean; updatedCount: number; message: string }> {
    return this.request('/recompute', {
      method: 'POST',
    });
  }

  // Statistics
  async getStatistics(): Promise<{
    totalRaters: number;
    totalComparisons: number;
    averageComparisons: number;
  }> {
    // This would be a real endpoint in production
    // For now, we'll implement a mock or calculate from other data
    const companyRanking = await this.getCompanyRanking();
    
    return {
      totalRaters: 4, // Mock data - would come from database
      totalComparisons: companyRanking.length * 10, // Mock calculation
      averageComparisons: companyRanking.length * 2.5, // Mock calculation
    };
  }
}

export const api = new ApiClient();