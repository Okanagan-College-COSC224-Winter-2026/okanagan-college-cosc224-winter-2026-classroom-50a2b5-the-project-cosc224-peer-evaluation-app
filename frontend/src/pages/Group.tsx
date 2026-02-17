import { useEffect, useState } from "react";
import {
  createGroup,
  listGroupMembers,
  listGroups,
  listStuGroup,
  listUnassignedStudents,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
  listClasses,
} from "../util/api";
import { useParams } from "react-router-dom";
import "./Group.css";
import TabNavigation from "../components/TabNavigation";
import StatusMessage from "../components/StatusMessage";
import { isTeacher } from "../util/login";
import Textbox from "../components/Textbox";

// Group member type for internal state
interface GroupMember {
  id: number;
  name: string;
  email: string;
}

export default function Group() {
  const { id } = useParams(); // This is now courseId
  const courseId = Number(id);
  
  const [className, setClassName] = useState<string>("");
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number>(-1);
  const [groupMembers, setGroupMembers] = useState<{ [key: number]: GroupMember[] }>({});
  const [unassignedStudents, setUnassignedStudents] = useState<GroupMember[]>([]);
  const [groupName, setGroupName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [myGroup, setMyGroup] = useState<{ name: string; members: GroupMember[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get course name
      const classes = await listClasses();
      const currentClass = classes.find((c: { id: number }) => c.id === courseId);
      setClassName(currentClass?.name || "");

      if (isTeacher()) {
        // Teacher view: load groups, members, and unassigned
        const groupsData = await listGroups(courseId);
        setGroups(groupsData);

        // Load members for each group
        const membersData: { [key: number]: GroupMember[] } = {};
        for (const group of groupsData) {
          const members = await listGroupMembers(group.id);
          membersData[group.id] = members;
        }
        setGroupMembers(membersData);

        // Load unassigned students
        const unassigned = await listUnassignedStudents(courseId);
        setUnassignedStudents(unassigned);
      } else {
        // Student view: load their group
        const myGroupData = await listStuGroup(courseId);
        setMyGroup(myGroupData);
      }
    } catch (error) {
      console.error("Error loading group data:", error);
      setStatusType('error');
      setStatusMessage('Error loading group data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setStatusType('error');
      setStatusMessage('Please enter a group name');
      return;
    }

    try {
      const newGroup = await createGroup(courseId, groupName);
      setGroups([...groups, newGroup]);
      setGroupMembers({ ...groupMembers, [newGroup.id]: [] });
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
      await deleteGroup(selectedGroup);
      
      // Update local state
      setGroups(groups.filter(g => g.id !== selectedGroup));
      const newMembers = { ...groupMembers };
      
      // Move members back to unassigned
      const removedMembers = newMembers[selectedGroup] || [];
      setUnassignedStudents([...unassignedStudents, ...removedMembers]);
      
      delete newMembers[selectedGroup];
      setGroupMembers(newMembers);
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
      await addGroupMember(selectedGroup, userId);
      
      // Update local state
      const student = unassignedStudents.find(s => s.id === userId);
      if (student) {
        setUnassignedStudents(unassignedStudents.filter(s => s.id !== userId));
        setGroupMembers({
          ...groupMembers,
          [selectedGroup]: [...(groupMembers[selectedGroup] || []), student]
        });
      }
      
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
      await removeGroupMember(groupId, userId);
      
      // Update local state
      const student = groupMembers[groupId]?.find(s => s.id === userId);
      if (student) {
        setGroupMembers({
          ...groupMembers,
          [groupId]: groupMembers[groupId].filter(s => s.id !== userId)
        });
        setUnassignedStudents([...unassignedStudents, student]);
      }
      
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

  return (
    <>
      <div className="ClassHeader">
        <div className="ClassHeaderLeft">
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

      <div className="AssignmentPage">
        {isTeacher() ? (
          <>
            <div className="assignmentTables">
              {/* Unassigned Students Table */}
              <table className="table">
                <thead>
                  <tr>
                    <th>Unassigned Students</th>
                  </tr>
                </thead>
                <tbody>
                  {unassignedStudents.length === 0 ? (
                    <tr><td>No unassigned students</td></tr>
                  ) : (
                    unassignedStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <span className="StudentName">{student.name}</span>
                          <button onClick={() => handleAddToGroup(student.id)}>
                            Add to Group
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Groups Table */}
              <table className="table">
                <thead>
                  <tr>
                    <th>Groups</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr><td>No groups created yet</td></tr>
                  ) : (
                    groups.map((group) => (
                      <>
                        <tr
                          key={group.id}
                          className={
                            "groupNames " +
                            (group.id === selectedGroup ? "selected" : "")
                          }
                          onClick={() => setSelectedGroup(group.id)}
                        >
                          <td>
                            <div className="GroupArrow">
                              <img src="/icons/arrow.svg" alt="arrow" />
                            </div>
                            {group.name} ({groupMembers[group.id]?.length || 0} members)
                          </td>
                        </tr>

                        {selectedGroup === group.id && (
                          groupMembers[group.id]?.map((member) => (
                            <tr key={member.id} className="groupMember">
                              <td>
                                <span className="StudentName">{member.name}</span>
                                <button onClick={() => handleRemoveFromGroup(member.id, group.id)}>
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="groupActions">
              <button onClick={handleDeleteGroup} disabled={selectedGroup === -1}>
                Delete Selected Group
              </button>
            </div>

            {/* Create Group Form */}
            <div className="createGroupForm">
              <Textbox
                placeholder="New group name..."
                onInput={setGroupName}
                className="groupNameInput"
              />
              <button onClick={handleCreateGroup}>
                Create New Group
              </button>
            </div>
          </>
        ) : (
          /* Student View */
          <div className="studentGroupView">
            {myGroup ? (
              <>
                <h3>My Group: {myGroup.name}</h3>
                <table className="studentTable">
                  <thead>
                    <tr>
                      <th>Group Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myGroup.members.map((member) => (
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
