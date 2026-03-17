import { useState } from "react";
import { useParams } from "react-router-dom";
import TabNavigation from "../../ui/TabNavigation";
import StatusMessage from "../../ui/StatusMessage";
import { isTeacher } from "../../util/login";
import Textbox from "../../ui/Textbox";
import { useClasses } from "../classes/useClasses";
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

function GroupMembersRow({
  group,
  selectedGroup,
  groupMembers,
  trClasses,
  actionBtnClasses,
  onRemove,
}: {
  group: CourseGroup;
  selectedGroup: number;
  groupMembers: GroupMember[];
  trClasses: string;
  actionBtnClasses: string;
  onRemove: (userId: number, groupId: number) => void;
}) {
  const { data: members = [] } = useGroupMembers(group.id);

  // Expose fetched members to parent via the groupMembers map isn't possible here,
  // so we use the hook data directly for rendering
  const displayMembers: GroupMember[] = members.length > 0 ? members : groupMembers;

  return (
    <>
      {selectedGroup === group.id && (
        displayMembers.map((member: GroupMember) => (
          <tr key={member.id} className={`${trClasses} hover:bg-bg-secondary`}>
            <td>
              <span className="mx-2.5 ml-5">{member.name}</span>
              <button className={actionBtnClasses} onClick={() => onRemove(member.id, group.id)}>
                Remove
              </button>
            </td>
          </tr>
        ))
      )}
    </>
  );
}

export default function Group() {
  const { id } = useParams();
  const courseId = Number(id);

  const [selectedGroup, setSelectedGroup] = useState<number>(-1);
  const [groupName, setGroupName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');

  const { data: classes = [] } = useClasses();
  const className = classes.find((c: { id: number }) => c.id === courseId)?.name || "";

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
    return <div>Loading...</div>;
  }

  const tableClasses = "w-1/2 h-full flex flex-col items-center border border-bg-secondary mx-2.5"
  const trClasses = "w-full flex flex-row items-center justify-between transition-all duration-100"
  const actionBtnClasses = "p-2 border-none bg-btn-primary text-white text-base cursor-pointer transition-all duration-100 hover:brightness-90 mx-2.5 ml-5"

  return (
    <>
      <div className="flex flex-row justify-between items-center p-3">
        <div className="flex flex-row justify-between items-center p-3">
          <h2>{className}</h2>
        </div>
      </div>

      <TabNavigation
        tabs={[
          {
            label: "Home",
            path: `/classes/${id}/home`,
          },
          {
            label: "Members",
            path: `/classes/${id}/members`,
          },
          {
            label: "Groups",
            path: `/classes/${id}/groups`,
          }
        ]}
      />

      <StatusMessage message={statusMessage} type={statusType} />

      <div>
        {isTeacher() ? (
          <>
            <div className="flex flex-row items-start">
              {/* Unassigned Students Table */}
              <table className={tableClasses}>
                <thead>
                  <tr>
                    <th>Unassigned Students</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedStudents.length === 0 ? (
                    <tr><td>No unassigned students</td></tr>
                  ) : (
                    unassignedStudents.map((student: GroupMember) => (
                      <tr key={student.id} className={`${trClasses} hover:bg-bg-secondary`}>
                        <td>
                          <span className="mx-2.5 ml-5">{student.name}</span>
                          <button className={actionBtnClasses} onClick={() => handleAddToGroup(student.id)}>
                            Add to Group
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Groups Table */}
              <table className={tableClasses}>
                <thead>
                  <tr>
                    <th>Groups</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr><td>No groups created yet</td></tr>
                  ) : (
                    groups.map((group: CourseGroup) => (
                      <>
                        <tr
                          key={group.id}
                          className={`flex flex-row items-center justify-center w-full relative items-center justify-center bg-[#eee] py-1 cursor-pointer ${group.id === selectedGroup ? '' : ''}`}
                          onClick={() => setSelectedGroup(group.id)}
                        >
                          <td>
                            <div className={`absolute top-1 left-5 w-5 h-5 ${group.id === selectedGroup ? 'rotate-90' : ''}`}>
                              <img src="/icons/arrow.svg" alt="arrow" className="w-full h-full" />
                            </div>
                            {group.name}
                          </td>
                        </tr>

                        <GroupMembersRow
                          group={group}
                          selectedGroup={selectedGroup}
                          groupMembers={[]}
                          trClasses={trClasses}
                          actionBtnClasses={actionBtnClasses}
                          onRemove={handleRemoveFromGroup}
                        />
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="p-2">
              <button
                className={`${actionBtnClasses} disabled:bg-btn-disabled disabled:cursor-not-allowed`}
                onClick={handleDeleteGroup}
                disabled={selectedGroup === -1}
              >
                Delete Selected Group
              </button>
            </div>

            {/* Create Group Form */}
            <div className="p-2 flex gap-2 items-center">
              <Textbox
                placeholder="New group name..."
                onInput={setGroupName}
                className="w-[15%]"
              />
              <button className={actionBtnClasses} onClick={handleCreateGroup}>
                Create New Group
              </button>
            </div>
          </>
        ) : (
          /* Student View */
          <div className="p-4">
            {myGroup ? (
              <>
                <h3>My Group: {myGroup.name}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Group Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myGroup.members.map((member: GroupMember) => (
                      <tr key={member.id}>
                        <td>{member.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p>You are not assigned to any group yet.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
