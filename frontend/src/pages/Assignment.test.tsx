import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Assignment from './Assignment';

const mockIsTeacher = vi.fn();
const mockGetUserId = vi.fn();

const getAssignmentMock = vi.fn();
const listStuGroupMock = vi.fn();
const createReviewMock = vi.fn();
const createCriterionMock = vi.fn();
const getReviewMock = vi.fn();
const editAssignmentMock = vi.fn();
const deleteAssignmentMock = vi.fn();
const getRubricForAssignmentMock = vi.fn();
const deleteRubricMock = vi.fn();
const getMySubmissionMock = vi.fn();
const uploadMySubmissionMock = vi.fn();
const deleteMySubmissionMock = vi.fn();
const listAssignmentResourcesMock = vi.fn();
const uploadAssignmentResourceMock = vi.fn();
const deleteAssignmentResourceMock = vi.fn();

vi.mock('../components/RubricCreator', () => ({
  default: () => <div>Rubric Creator</div>,
}));

vi.mock('../components/RubricDisplay', () => ({
  default: () => <div>Rubric Display</div>,
}));

vi.mock('../util/login', () => ({
  isTeacher: () => mockIsTeacher(),
  getUserId: () => mockGetUserId(),
}));

vi.mock('../util/api', () => ({
  getAssignment: (...args: unknown[]) => getAssignmentMock(...args),
  listStuGroup: (...args: unknown[]) => listStuGroupMock(...args),
  createReview: (...args: unknown[]) => createReviewMock(...args),
  createCriterion: (...args: unknown[]) => createCriterionMock(...args),
  getReview: (...args: unknown[]) => getReviewMock(...args),
  editAssignment: (...args: unknown[]) => editAssignmentMock(...args),
  deleteAssignment: (...args: unknown[]) => deleteAssignmentMock(...args),
  getRubricForAssignment: (...args: unknown[]) => getRubricForAssignmentMock(...args),
  deleteRubric: (...args: unknown[]) => deleteRubricMock(...args),
  getMySubmission: (...args: unknown[]) => getMySubmissionMock(...args),
  uploadMySubmission: (...args: unknown[]) => uploadMySubmissionMock(...args),
  deleteMySubmission: (...args: unknown[]) => deleteMySubmissionMock(...args),
  listAssignmentResources: (...args: unknown[]) => listAssignmentResourcesMock(...args),
  uploadAssignmentResource: (...args: unknown[]) => uploadAssignmentResourceMock(...args),
  deleteAssignmentResource: (...args: unknown[]) => deleteAssignmentResourceMock(...args),
}));

describe('Assignment US9 UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserId.mockReturnValue(1);
    getAssignmentMock.mockResolvedValue({
      id: 5,
      courseID: 99,
      name: 'Assignment Title',
      description: 'Assignment description',
      is_anonymous: true,
    });
    listStuGroupMock.mockResolvedValue({ members: [] });
    getRubricForAssignmentMock.mockResolvedValue(null);
    getMySubmissionMock.mockResolvedValue(null);
    listAssignmentResourcesMock.mockResolvedValue([]);
    getReviewMock.mockResolvedValue({ ok: false });
  });

  it('renders tabs above assignment header on manage route', async () => {
    mockIsTeacher.mockReturnValue(true);
    window.history.pushState({}, '', '/assignments/5/manage');

    const { container } = render(
      <MemoryRouter initialEntries={['/assignments/5/manage']}>
        <Routes>
          <Route path='/assignments/:id/manage' element={<Assignment />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Manage Assignment');

    const tabNav = container.querySelector('.TabNav');
    const header = container.querySelector('.AssignmentHeader');

    expect(tabNav).not.toBeNull();
    expect(header).not.toBeNull();
    expect(tabNav?.compareDocumentPosition(header as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Anonymous submissions/reviews')).toBeInTheDocument();
  });

  it('shows teacher student-preview resources section in review tab', async () => {
    mockIsTeacher.mockReturnValue(true);
    listAssignmentResourcesMock.mockResolvedValue([
      {
        id: 1,
        assignmentID: 5,
        uploaderID: 3,
        original_name: 'guide.pdf',
        download_url: '/assignment-resource/file/1',
      },
    ]);

    window.history.pushState({}, '', '/assignments/5');

    render(
      <MemoryRouter initialEntries={['/assignments/5']}>
        <Routes>
          <Route path='/assignments/:id' element={<Assignment />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Supporting Documents (Student Preview)')).toBeInTheDocument();
    expect(screen.getByText('guide.pdf')).toBeInTheDocument();
  });

  it('shows student attachment workflow section in home tab', async () => {
    mockIsTeacher.mockReturnValue(false);

    window.history.pushState({}, '', '/assignments/5');

    render(
      <MemoryRouter initialEntries={['/assignments/5']}>
        <Routes>
          <Route path='/assignments/:id' element={<Assignment />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('My Attachment')).toBeInTheDocument();
    });

    expect(screen.getByText('Upload Attachment')).toBeInTheDocument();
    expect(screen.getByText('Supporting Documents')).toBeInTheDocument();
  });
});
