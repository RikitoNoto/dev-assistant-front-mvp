import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test-utils'; // パスを修正
import HomePage from '../../src/pages/HomePage'; // パスを更新
import { getProjects, createProject } from '../../src/services/api'; // パスを更新
import { Project } from '../../src/types'; // パスを更新

// モック関数を型付けして使いやすくする
const mockGetProjects = getProjects as vi.Mock;
const mockCreateProject = createProject as vi.Mock;

// useNavigateのモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// テスト用のプロジェクトデータ
const mockProjects: Project[] = [
  { id: '1', name: 'Project Alpha', description: 'Desc Alpha', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Project Beta', description: 'Desc Beta', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

describe('HomePage', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
    // デフォルトでgetProjectsは成功し、データを返すように設定
    mockGetProjects.mockResolvedValue([...mockProjects]);
  });

  it('必須要素が初期表示されること', async () => {
    render(<HomePage />);

    // ローディングが終わるのを待つ (findByRoleは非同期)
    expect(await screen.findByRole('heading', { name: /Your Projects/i })).toBeInTheDocument();
    expect(screen.getByText(/Select a project to view details or create a new one/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Project/i })).toBeInTheDocument();
  });

  it('プロジェクト一覧が正しく表示されること', async () => {
    render(<HomePage />);

    // getProjectsが呼ばれるのを待つ必要はない (useEffect内で呼ばれ、状態更新後に表示される)
    // ローディングが消えるのを待つ
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // 各プロジェクトカードが表示されていることを確認
    for (const project of mockProjects) {
      expect(await screen.findByText(project.name)).toBeInTheDocument();
    }

    // getProjectsが1回呼び出されたことを確認
    expect(mockGetProjects).toHaveBeenCalledTimes(1);
  });

  it('プロジェクトがない場合にメッセージが表示されること', async () => {
    // このテストケースではgetProjectsが空配列を返すようにオーバーライド
    mockGetProjects.mockResolvedValueOnce([]);
    render(<HomePage />);

    // ローディングが消えるのを待つ
    await waitFor(() => {
       expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // 「No projects yet」メッセージと作成ボタンが表示されることを確認
    expect(await screen.findByText(/No projects yet/i)).toBeInTheDocument();
     expect(screen.getByRole('button', { name: /Create Project/i })).toBeInTheDocument();
   });

   it('プロジェクトカードをクリックすると詳細ページに遷移すること', async () => {
     const user = userEvent.setup();
     render(<HomePage />);

     // ローディングが消え、プロジェクトカードが表示されるのを待つ
     const projectCard = await screen.findByText(mockProjects[0].name);

     // プロジェクトカードをクリック
     await user.click(projectCard);

     // navigateが正しいURLで呼び出されたことを確認
     expect(mockNavigate).toHaveBeenCalledWith(`/project/${mockProjects[0].id}`);
   });

   it('「New Project」ボタンをクリックするとモーダルが表示されること', async () => {
     const user = userEvent.setup();
     render(<HomePage />);

     // ローディングが終わるのを待つ
     await screen.findByRole('heading', { name: /Your Projects/i });

     // 「New Project」ボタンをクリック
     const newProjectButton = screen.getByRole('button', { name: /New Project/i });
     await user.click(newProjectButton);

     // モーダルのタイトルが表示されることを確認 (モーダルが開いたことの指標)
     // findByRoleを使うことで、要素が表示されるまで待機する
     expect(await screen.findByRole('heading', { name: /Create New Project/i })).toBeInTheDocument();
   });

   it('新規プロジェクトを作成できること', async () => {
     const user = userEvent.setup();
     const newProjectName = 'Project Gamma';
     const newProject: Project = { id: '3', name: newProjectName, description: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
     // createProjectが成功した場合のレスポンスを設定
     mockCreateProject.mockResolvedValue(newProject);

     render(<HomePage />);

     // ローディングが終わるのを待つ
     await screen.findByRole('heading', { name: /Your Projects/i });

     // 1. モーダルを開く
     const newProjectButton = screen.getByRole('button', { name: /New Project/i });
     await user.click(newProjectButton);
     expect(await screen.findByRole('heading', { name: /Create New Project/i })).toBeInTheDocument();

     // 2. プロジェクト名を入力
     const nameInput = screen.getByLabelText(/Project Name/i);
     await user.type(nameInput, newProjectName);

     // 3. 作成ボタンをクリック
     const createButton = screen.getByRole('button', { name: /Create Project/i }); // モーダル内の作成ボタン
     await user.click(createButton);

     // 4. createProject APIが呼ばれたことを確認
     expect(mockCreateProject).toHaveBeenCalledTimes(1);
     expect(mockCreateProject).toHaveBeenCalledWith(newProjectName);

     // 5. モーダルが閉じたことを確認 (モーダルのタイトルが消える)
     await waitFor(() => {
       expect(screen.queryByRole('heading', { name: /Create New Project/i })).not.toBeInTheDocument();
     });

     // 6. 新しいプロジェクトがリストに追加されたことを確認 (非同期で状態が更新されるのを待つ)
     //    ここではnavigateが呼ばれることを確認する方がHomePageの責務として適切かもしれない
     // expect(await screen.findByText(newProjectName)).toBeInTheDocument();

     // 7. 新しいプロジェクトページに遷移することを確認
     expect(mockNavigate).toHaveBeenCalledWith(`/project/${newProject.id}`);
   });
 });
