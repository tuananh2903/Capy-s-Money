import { fetchProfile, updateProfileName } from '../../src/services/profileService';
import { supabase } from '../../src/services/supabaseClient';

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches profile successfully', async () => {
    const mockData = { id: 'u1', display_name: 'Capy User', onboarding_completed: true };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await fetchProfile('u1');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSelect).toHaveBeenCalledWith('id, display_name, jars_ratios');
    expect(mockEq).toHaveBeenCalledWith('id', 'u1');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
  });

  it('returns error when profile fetch fails', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch error' } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await fetchProfile('u1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Không thể tải thông tin hồ sơ.');
  });

  it('updates display name successfully', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

    const result = await updateProfileName('u1', 'New Name');

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockUpdate).toHaveBeenCalledWith({ display_name: 'New Name' });
    expect(mockEq).toHaveBeenCalledWith('id', 'u1');
    expect(result.success).toBe(true);
  });
});
