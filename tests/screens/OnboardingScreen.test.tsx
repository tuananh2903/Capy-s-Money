import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import OnboardingScreen from '../../src/screens/OnboardingScreen';

// Mock CapyMascot
jest.mock('../../src/components/CapyMascot', () => {
  const { View, Text } = require('react-native');
  return function MockCapyMascot({ type }: { type: string }) {
    return <View><Text>CapyMascot {type}</Text></View>;
  };
});

describe('OnboardingScreen', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const bypassStep1 = (getByText: any, getByPlaceholderText: any) => {
    const nameInput = getByPlaceholderText('Ví của tôi');
    fireEvent.changeText(nameInput, 'Ví Lương');
    const balanceInput = getByPlaceholderText('0');
    fireEvent.changeText(balanceInput, '10,000,000');
    fireEvent.press(getByText('Tạo ví nào! 🐾'));
    act(() => {
      jest.advanceTimersByTime(2500);
    });
  };

  it('renders Step 1: Wallet Creation, validates input, and transitions to Step 2', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    expect(getByText('Tạo ví đầu tiên của bạn')).toBeTruthy();

    const nameInput = getByPlaceholderText('Ví của tôi');
    const balanceInput = getByPlaceholderText('0');

    // Default values
    expect(nameInput.props.value).toBe('Ví của tôi');
    expect(balanceInput.props.value).toBe('0');

    // Empty name validation
    fireEvent.changeText(nameInput, '');
    fireEvent.press(getByText('Tạo ví nào! 🐾'));
    expect(getByText('Hãy đặt tên cho ví của bạn nhé! 🌱')).toBeTruthy();

    // Too long name validation
    fireEvent.changeText(nameInput, 'a'.repeat(33));
    fireEvent.press(getByText('Tạo ví nào! 🐾'));
    expect(getByText('Tên ví tối đa 32 ký tự thôi nha!')).toBeTruthy();

    // Negative balance validation
    fireEvent.changeText(nameInput, 'Ví Tiền Mặt');
    // For numeric inputs in React Native, we can simulate negative values
    fireEvent.changeText(balanceInput, '-500');
    fireEvent.press(getByText('Tạo ví nào! 🐾'));
    expect(getByText('Số dư không thể nhỏ hơn 0 đâu nhé!')).toBeTruthy();

    // Valid inputs
    fireEvent.changeText(balanceInput, '5,000,000');
    fireEvent.press(getByText('Tạo ví nào! 🐾'));

    // Success screen
    expect(getByText('🎉 Chúc mừng bạn đã tạo ví đầu tiên thành công! Cùng quản lý tài chính với chú capybara nào!')).toBeTruthy();

    // Move to step 2 after animation time
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(getByText('Công thức 6 Hũ Tài Chính')).toBeTruthy();
  });

  it('renders Step 2: 6 Jars selection, customizes percentages, validates 100% total', async () => {
    const { getByText, getByPlaceholderText, queryByText, queryAllByPlaceholderText } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    bypassStep1(getByText, getByPlaceholderText);

    expect(getByText('Công thức 6 Hũ Tài Chính')).toBeTruthy();

    // Default template A has Tiếp tục active because it sums to 100%
    // Let's switch to Template B
    fireEvent.press(getByText('Trống (Tự điền)'));

    // Remaining warning shows "Còn 100% chưa phân bổ, bạn điều chỉnh thêm nhé!"
    expect(getByText('Còn 100% chưa phân bổ, bạn điều chỉnh thêm nhé!')).toBeTruthy();

    // Let's find inputs for the jars
    // The inputs should have placeholders or labels for their respective jars
    const necInput = getByPlaceholderText('Hũ Thiết yếu');
    const ltInput = getByPlaceholderText('Hũ Tiết kiệm');
    const ffaInput = getByPlaceholderText('Hũ Tự do TC');
    const eduInput = getByPlaceholderText('Hũ Giáo dục');
    const playInput = getByPlaceholderText('Hũ Hưởng thụ');
    const giveInput = getByPlaceholderText('Hũ Cho đi');

    // Fill in sum > 100%
    fireEvent.changeText(necInput, '60');
    fireEvent.changeText(ltInput, '20');
    fireEvent.changeText(ffaInput, '30'); // total = 110%
    expect(getByText('Bạn vượt quá 10%')).toBeTruthy();

    // Fill in sum = 100%
    fireEvent.changeText(necInput, '50');
    fireEvent.changeText(ltInput, '10');
    fireEvent.changeText(ffaInput, '15');
    fireEvent.changeText(eduInput, '10');
    fireEvent.changeText(playInput, '10');
    fireEvent.changeText(giveInput, '5'); // total = 100%

    expect(queryByText(/chưa phân bổ/)).toBeNull();
    expect(queryByText(/vượt quá/)).toBeNull();

    // Continue to step 3
    fireEvent.press(getByText('Tiếp tục'));
    expect(getByText('Mục tiêu tài chính của bạn?')).toBeTruthy();
  });

  it('renders Step 3: Goals selection, handles skip, handles custom goal selection, and submits', async () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    bypassStep1(getByText, getByPlaceholderText);

    // Step 2 next
    fireEvent.press(getByText('Tiếp tục'));

    // Step 3
    expect(getByText('Mục tiêu tài chính của bạn?')).toBeTruthy();

    // Test skip button
    fireEvent.press(getByText('Bỏ qua, làm sau'));
    expect(mockOnComplete).toHaveBeenCalledWith(
      '',
      10000000,
      'Ví Lương',
      { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 }
    );

    // Clear call log
    mockOnComplete.mockClear();

    // Re-render to test complete with specific goal
    const { getByText: getByText2, getByPlaceholderText: getByPlaceholderText2 } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );
    bypassStep1(getByText2, getByPlaceholderText2);
    fireEvent.press(getByText2('Tiếp tục'));

    // Select standard goal: "Tiết kiệm mua nhà/xe"
    fireEvent.press(getByText2('Tiết kiệm mua nhà/xe'));
    fireEvent.press(getByText2('Xong! Bắt đầu thôi!'));

    expect(mockOnComplete).toHaveBeenCalledWith(
      'Tiết kiệm mua nhà/xe',
      10000000,
      'Ví Lương',
      { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 }
    );

    // Clear call log
    mockOnComplete.mockClear();

    // Re-render to test "Khác" goal
    const { getByText: getByText3, getByPlaceholderText: getByPlaceholderText3, queryByPlaceholderText: queryByPlaceholderText3 } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );
    bypassStep1(getByText3, getByPlaceholderText3);
    fireEvent.press(getByText3('Tiếp tục'));

    // Press "Khác"
    fireEvent.press(getByText3('Khác'));

    // Check custom text input appears
    const customGoalInput = getByPlaceholderText3('Nhập mục tiêu khác của bạn...');
    expect(customGoalInput).toBeTruthy();

    // Validation check: empty custom goal
    fireEvent.changeText(customGoalInput, '');
    fireEvent.press(getByText3('Xong! Bắt đầu thôi!'));
    expect(getByText3('Vui lòng nhập mục tiêu của bạn.')).toBeTruthy();

    // Validation check: too long custom goal
    fireEvent.changeText(customGoalInput, 'a'.repeat(51));
    fireEvent.press(getByText3('Xong! Bắt đầu thôi!'));
    expect(getByText3('Mục tiêu tối đa 50 ký tự thôi nha!')).toBeTruthy();

    // Fill valid custom goal
    fireEvent.changeText(customGoalInput, 'Đi du lịch Nhật Bản');
    fireEvent.press(getByText3('Xong! Bắt đầu thôi!'));

    expect(mockOnComplete).toHaveBeenCalledWith(
      'Đi du lịch Nhật Bản',
      10000000,
      'Ví Lương',
      { nec: 55, lt: 10, ffa: 10, edu: 10, play: 10, give: 5 }
    );
  });
});
