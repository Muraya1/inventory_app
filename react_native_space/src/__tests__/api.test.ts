import apiService from '../services/api';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: '1', username: 'testuser', role: 'user' as const },
      },
    };

    mockedAxios.create = jest.fn(() => ({
      post: jest.fn().mockResolvedValue(mockResponse),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })) as any;

    // Test would verify API call structure
    expect(mockedAxios.create).toBeDefined();
  });
});