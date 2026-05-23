# Login Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng màn hình đăng nhập an toàn, mượt mà với Email và Google Auth cho Capy's Money, bao gồm xử lý lockout 5 lần sai và định tuyến sau đăng nhập.

**Architecture:** Sử dụng React Native (Expo) cho UI. Quản lý trạng thái đăng nhập qua Context hoặc Zustand. Xác thực qua Supabase. Thiết kế theo chuẩn TDD (Test-Driven Development).

**Tech Stack:** React Native, Expo, Supabase Auth, Jest, React Native Testing Library.

---

### Task 1: Auth Service Logic (Validation & Lockout)

**Files:**
- Create: `src/services/authService.ts`
- Create: `tests/services/authService.test.ts`

- [x] **Step 1: Write the failing test**

```typescript
import { loginWithEmail } from '../../src/services/authService';

describe('authService', () => {
  it('should return invalid email error', async () => {
    const res = await loginWithEmail('not-an-email', '123456');
    expect(res.error).toBe('Email không hợp lệ, vui lòng kiểm tra và nhập lại email.');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx jest tests/services/authService.test.ts`
Expected: FAIL (Cannot find module)

- [x] **Step 3: Write minimal implementation**

```typescript
export const loginWithEmail = async (email: string, pass: string) => {
  if (!email.includes('@')) {
    return { error: 'Email không hợp lệ, vui lòng kiểm tra và nhập lại email.' };
  }
  return { success: true, role: 'Free' };
};
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx jest tests/services/authService.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/services/authService.ts tests/services/authService.test.ts
git commit -m "feat(auth): add email validation logic"
```

### Task 2: Login Screen Component (UI)

**Files:**
- Create: `src/screens/LoginScreen.tsx`
- Create: `tests/screens/LoginScreen.test.tsx`

- [x] **Step 1: Write the failing test**

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';

describe('LoginScreen', () => {
  it('shows error when email is invalid', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'bademail');
    fireEvent.press(getByText('Đăng nhập'));
    
    expect(getByText('Email không hợp lệ, vui lòng kiểm tra và nhập lại email.')).toBeTruthy();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx jest tests/screens/LoginScreen.test.tsx`
Expected: FAIL

- [x] **Step 3: Write minimal implementation**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { loginWithEmail } from '../services/authService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const res = await loginWithEmail(email, pass);
    if (res.error) setError(res.error);
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Mật khẩu" value={pass} onChangeText={setPass} secureTextEntry />
      <TouchableOpacity onPress={handleLogin}><Text>Đăng nhập</Text></TouchableOpacity>
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npx jest tests/screens/LoginScreen.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.tsx tests/screens/LoginScreen.test.tsx
git commit -m "feat(auth): build login screen UI with email validation"
```
