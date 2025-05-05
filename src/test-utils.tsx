import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest'; // vitestからviをインポート

// APIモジュール全体をモック
vi.mock('./services/api', () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
  // 他に必要なAPI関数があればここに追加
}));

// カスタムレンダー関数
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// React Testing Libraryのすべてを再エクスポート
export * from '@testing-library/react';

// カスタムレンダーメソッドをオーバーライドしてエクスポート
export { customRender as render };

// モック関数を使いやすくするためにエクスポート (オプション)
// import { getProjects, createProject } from './services/api';
// export const mockGetProjects = getProjects as vi.Mock;
// export const mockCreateProject = createProject as vi.Mock;
// 必要に応じて上記のようにモック関数をキャストしてエクスポートできます
