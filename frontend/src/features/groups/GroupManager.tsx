import { useState } from "react";
import { useParams } from "react-router-dom";
import StatusMessage from "../../ui/StatusMessage";
import { isTeacher } from "../../util/login";
import Textbox from "../../ui/Textbox";
import {
  useGroups,
  useMyGroup,
  useUnassignedStudents,
  useGroupMembers,
  useCreateGroup,
  useDeleteGroup,
  useAddGroupMember,
  useRemoveGroupMember,
} from "./useGroups";

// Group member type for internal state
interface GroupMember {
  id: number;
  name: string;
  email: string;
}

function GroupMembersPanel({
  group,
  isOpen,
  onRemove,
}: {
  group: CourseGroup;
  isOpen: boolean;
  onRemove: (userId: number, groupId: number) => void;
}) {
  const { data: members = [] } = useGroupMembers(group.id);

  if (!isOpen || members.length === 0) return null;

  return (
    <div className="flex flex-col divide-y divide-border">
      {members.map((member: GroupMember) => (
        <div key={member.id} className="flex items-center justify-between py-2 px-4 pl-8 hover:bg-bg-secondary transition-colors">
          <span className="text-sm text-text-primary">{member.name}</span>
          <button
            className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
            onClick={() => onRemove(member.id, group.id)}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Group() {
  const { id } = useParams();
  const courseId = Number(id);

  const [selectedGroup, setSelectedGroup] = useState<number>(-1);
  const [groupName, setGroupName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');

  const { data: groups = [], isLoading: groupsLoading } = useGroups(courseId);
  const { data: unassignedStudents = [], isLoading: unassignedLoading } = useUnassignedStudents(courseId);
  const { data: myGroup = null, isLoading: myGroupLoading } = useMyGroup(courseId);

  const createGroupMutation = useCreateGroup(courseId);
  const deleteGroupMutation = useDeleteGroup(courseId);
  const addMemberMutation = useAddGroupMember(courseId);
  const removeMemberMutation = useRemoveGroupMember(courseId);

  const loading = isTeacher() ? (groupsLoading || unassignedLoading) : myGroupLoading;

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setStatusType('error');
      setStatusMessage('Please enter a group name');
      return;
    }

    try {
      await createGroupMutation.mutateAsync(groupName);
      setGroupName('');
      setStatusType('success');
      setStatusMessage('Group created!');
    } catch (error) {
      console.error("Error creating group:", error);
      setStatusType('error');
      setStatusMessage('Error creating group');
    }
  };

  const handleDeleteGroup = async () => {
    if (selectedGroup === -1) {
      setStatusType('error');
      setStatusMessage('Please select a group first');
      return;
    }

    try {
      await deleteGroupMutation.mutateAsync(selectedGroup);
      setSelectedGroup(-1);
      setStatusType('success');
      setStatusMessage('Group deleted!');
    } catch (error) {
      console.error("Error deleting group:", error);
      setStatusType('error');
      setStatusMessage('Error deleting group');
    }
  };

  const handleAddToGroup = async (userId: number) => {
    if (selectedGroup === -1) {
      setStatusType('error');
      setStatusMessage('Please select a group first');
      return;
    }

    try {
      await addMemberMutation.mutateAsync({ groupId: selectedGroup, userId });
      setStatusType('success');
      setStatusMessage('Student added to group!');
    } catch (error) {
      console.error("Error adding member:", error);
      setStatusType('error');
      setStatusMessage('Error adding student to group');
    }
  };

  const handleRemoveFromGroup = async (userId: number, groupId: number) => {
    try {
      await removeMemberMutation.mutateAsync({ groupId, userId });
      setStatusType('success');
      setStatusMessage('Student removed from group!');
    } catch (error) {
      console.error("Error removing member:", error);
      setStatusType('error');
      setStatusMessage('Error removing student from group');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="max-w-5xl mx-auto text-text-secondary text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full">
      {isTeacher() ? (
        <div className="max-w-5xl mx-auto rounded-2xl bg-white shadow-sm border border-border p-5 md:p-8 flex flex-col gap-6">
          {statusMessage && <StatusMessage message={statusMessage} type={statusType} className="mb-0" />}

          {/* Create Group Form */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Textbox
              placeholder="New group name..."
              onInput={setGroupName}
              value={groupName}
              className="flex-1 sm:max-w-xs"
            />
            <button
              className="px-4 py-2 bg-btn-primary text-white text-sm font-medium rounded-lg cursor-pointer transition-colors hover:brightness-90"
              onClick={handleCreateGroup}
            >
              Create Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unassigned Students */}
            <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-slate-50">
                <h3 className="m-0 text-sm font-semibold text-text-primary">
                  Unassigned Students
                  <span className="ml-2 text-text-secondary font-normal">({unassignedStudents.length})</span>
                </h3>
              </div>
              {unassignedStudents.length === 0 ? (
                <p className="text-text-secondary text-sm p-4 m-0">No unassigned students</p>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {unassignedStudents.map((student: GroupMember) => (
                    <div key={student.id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors">
                      <span className="text-sm text-text-primary">{student.name}</span>
                      <button
                        className="text-xs font-medium text-btn-primary hover:text-white px-3 py-1 rounded-md border border-btn-primary hover:bg-btn-primary transition-colors"
                        onClick={() => handleAddToGroup(student.id)}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Groups */}
            <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-slate-50 flex items-center justify-between">
                <h3 className="m-0 text-sm font-semibold text-text-primary">
                  Groups
                  <span className="ml-2 text-text-secondary font-normal">({groups.length})</span>
                </h3>
                {selectedGroup !== -1 && (
                  <button
                    className="text-xs font-medium text-red-600 hover:text-white px-3 py-1 rounded-md border border-red-300 hover:bg-red-600 transition-colors"
                    onClick={handleDeleteGroup}
                  >
                    Delete Selected
                  </button>
                )}
              </div>
              {groups.length === 0 ? (
                <p className="text-text-secondary text-sm p-4 m-0">No groups created yet</p>
              ) : (
                <div className="flex flex-col">
                  {groups.map((group: CourseGroup) => (
                    <div key={group.id}>
                      <div
                        className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer transition-colors border-b border-border bg-white ${
                          selectedGroup === group.id
                            ? "bg-btn-primary/5 border-l-2 border-l-btn-primary"
                            : "hover:bg-slate-50"
                        }`}
                        onClick={() => setSelectedGroup(selectedGroup === group.id ? -1 : group.id)}
                      >
                        <span className={`text-xs text-text-secondary transition-transform ${selectedGroup === group.id ? "rotate-90" : ""}`}>
                          &#9654;
                        </span>
                        <span className="text-sm font-medium text-text-primary">{group.name}</span>
                      </div>
                      <GroupMembersPanel
                        group={group}
                        isOpen={selectedGroup === group.id}
                        onRemove={handleRemoveFromGroup}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Student View */
        <div className="max-w-2xl mx-auto rounded-2xl bg-white shadow-sm border border-border p-5 md:p-8 flex flex-col gap-4">
          {statusMessage && <StatusMessage message={statusMessage} type={statusType} className="mb-0" />}
          {myGroup ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-slate-50">
                <h3 className="m-0 text-sm font-semibold text-text-primary">My Group: {myGroup.name}</h3>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {myGroup.members.map((member: GroupMember) => (
                  <div key={member.id} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                    <div className="w-8 h-8 rounded-full bg-btn-primary/15 flex items-center justify-center text-xs font-semibold text-btn-primary flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-text-primary">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm m-0">You are not assigned to any group yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
