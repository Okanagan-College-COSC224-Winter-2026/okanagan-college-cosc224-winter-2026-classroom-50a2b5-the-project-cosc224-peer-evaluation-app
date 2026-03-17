import { render, screen } from '@testing-library/react';
import Home from './DashboardLayout';

const listClassesMock = vi.fn();
const listAssignmentsMock = vi.fn();
const isTeacherMock = vi.fn();
const isAdminMock = vi.fn();
const isStudentMock = vi.fn();

vi.mock('../../util/api', () => ({
  listClasses: (...args: unknown[]) => listClassesMock(...args),
  listAssignments: (...args: unknown[]) => listAssignmentsMock(...args),
}));

vi.mock('../../util/login', () => ({
  isTeacher: () => isTeacherMock(),
  isAdmin: () => isAdminMock(),
  isStudent: () => isStudentMock(),
}));

describe('Home US19 course access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTeacherMock.mockReturnValue(false);
    isAdminMock.mockReturnValue(false);
    isStudentMock.mockReturnValue(true);
  });

  it('shows a helpful empty state for students with no courses', async () => {
    listClassesMock.mockResolvedValue([]);

    render(<Home />);

    expect(await screen.findByText('No courses available')).toBeInTheDocument();
    expect(
      screen.getByText('You are not registered in any courses yet. Please contact your teacher to be added.')
    ).toBeInTheDocument();
  });

  it('renders registered courses on dashboard', async () => {
    listClassesMock.mockResolvedValue([{ id: 42, name: 'CS 101' }]);
    listAssignmentsMock.mockResolvedValue([]);

    render(<Home />);

    expect(await screen.findByText('CS 101')).toBeInTheDocument();
    expect(screen.getByText('0 assignments')).toBeInTheDocument();
  });
});
