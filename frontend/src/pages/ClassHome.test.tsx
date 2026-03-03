import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClassHome from './ClassHome';

const listAssignmentsMock = vi.fn();
const listClassesMock = vi.fn();
const createAssignmentMock = vi.fn();
const importCSVMock = vi.fn();
const isTeacherMock = vi.fn();

vi.mock('../util/api', () => ({
  listAssignments: (...args: unknown[]) => listAssignmentsMock(...args),
  listClasses: (...args: unknown[]) => listClassesMock(...args),
  createAssignment: (...args: unknown[]) => createAssignmentMock(...args),
}));

vi.mock('../util/csv', () => ({
  importCSV: (...args: unknown[]) => importCSVMock(...args),
}));

vi.mock('../util/login', () => ({
  isTeacher: () => isTeacherMock(),
}));

describe('ClassHome US9 create-assignment flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isTeacherMock.mockReturnValue(true);
    listAssignmentsMock.mockResolvedValue([]);
    listClassesMock.mockResolvedValue([{ id: 42, name: 'CS 101' }]);
    createAssignmentMock.mockResolvedValue({
      assignment: {
        id: 7,
        courseID: 42,
        name: 'New Assignment',
        description: 'desc',
      },
    });
  });

  it('defaults anonymity checkbox to checked and submits true', async () => {
    render(
      <MemoryRouter initialEntries={['/classes/42/home']}>
        <Routes>
          <Route path='/classes/:id/home' element={<ClassHome />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Assignments');

    fireEvent.click(screen.getByText('+ New Assignment'));

    const checkbox = screen.getByRole('checkbox', { name: /anonymous submissions\/reviews/i });
    expect(checkbox).toBeChecked();

    const nameInput = screen.getByPlaceholderText('Enter assignment name...');
    fireEvent.input(nameInput, { target: { value: 'US9 Anonymous Assignment' } });

    fireEvent.click(screen.getByText('Create Assignment'));

    await waitFor(() => {
      expect(createAssignmentMock).toHaveBeenCalledWith(
        42,
        'US9 Anonymous Assignment',
        undefined,
        undefined,
        undefined,
        true,
      );
    });
  });
});
