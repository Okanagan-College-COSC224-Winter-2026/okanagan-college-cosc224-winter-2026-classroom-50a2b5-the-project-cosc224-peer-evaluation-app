import { useState } from "react";
import Button from "../components/Button";
import Textbox from "../components/Textbox";
import StatusMessage from "../components/StatusMessage";
import "./RandomGroupCreation.css";
import { isTeacher } from "../util/login";

interface GroupPreview {
  id: number;
  name: string;
  memberCount: number;
  members: Array<{ id: number; name: string; email: string }>;
}

interface RemainingStudent {
  id: number;
  name: string;
  email: string;
}

interface RandomGroupResponse {
  msg: string;
  strategy: string;
  groupCount?: number;
  totalStudents: number;
  groups: GroupPreview[];
  remainingStudents: RemainingStudent[];
  remainingCount: number;
  action?: string;
  notification?: string;
  membersPerGroup?: number;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function RandomGroupCreation({ courseId }: { courseId: number }) {
  const [groupCount, setGroupCount] = useState<string>("");
  const [membersPerGroup, setMembersPerGroup] = useState<string>("");
  const [groupNamePrefix, setGroupNamePrefix] = useState<string>("Group");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [previewGroups, setPreviewGroups] = useState<GroupPreview[]>([]);
  const [remainingStudents, setRemainingStudents] = useState<RemainingStudent[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [createdCount, setCreatedCount] = useState<number>(0);

  const validateInputs = (): boolean => {
    const groupCountNum = groupCount ? parseInt(groupCount) : null;
    const membersPerGroupNum = membersPerGroup ? parseInt(membersPerGroup) : null;

    if (!groupCountNum && !membersPerGroupNum) {
      setStatusMessage(
        "Please enter either number of groups or members per group (or both)"
      );
      setStatusType("error");
      return false;
    }

    if (groupCountNum && groupCountNum <= 0) {
      setStatusMessage("Group count must be greater than 0");
      setStatusType("error");
      return false;
    }

    if (membersPerGroupNum && membersPerGroupNum <= 0) {
      setStatusMessage("Members per group must be greater than 0");
      setStatusType("error");
      return false;
    }

    if (!groupNamePrefix.trim()) {
      setStatusMessage("Group name prefix cannot be empty");
      setStatusType("error");
      return false;
    }

    return true;
  };

  const handleCreateGroups = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setShowPreview(false);

    try {
      const payload: any = {
        courseID: courseId,
        groupNamePrefix: groupNamePrefix.trim(),
      };

      if (groupCount) {
        payload.groupCount = parseInt(groupCount);
      }

      if (membersPerGroup) {
        payload.membersPerGroup = parseInt(membersPerGroup);
      }

      const response = await fetch(`${BASE_URL}/groups/create-random`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || `Failed to create groups: ${response.status}`);
      }

      const data: RandomGroupResponse = await response.json();

      // Set preview data
      setPreviewGroups(data.groups);
      setRemainingStudents(data.remainingStudents);
      setCreatedCount(data.groups.length);
      setShowPreview(true);

      // Set status message
      if (data.action === "NOTIFY_WITH_DETAILS") {
        setStatusMessage(data.notification || "Groups created. Please review remaining students.");
        setStatusType("error");
      } else if (data.action === "NOTIFY") {
        setStatusMessage(data.notification || "Groups created. Some students not assigned.");
        setStatusType("error");
      } else {
        setStatusMessage("Groups created successfully!");
        setStatusType("success");
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to create groups"
      );
      setStatusType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStrategyDescription = (): string => {
    const gc = groupCount ? parseInt(groupCount) : null;
    const mpg = membersPerGroup ? parseInt(membersPerGroup) : null;

    if (gc && mpg) {
      return `Create ${gc} group(s) with ${mpg} member(s) each`;
    } else if (gc) {
      return `Distribute students evenly across ${gc} group(s)`;
    } else if (mpg) {
      return `Create groups with ${mpg} member(s) each (max possible)`;
    }
    return "Select parameters";
  };

  if (!isTeacher()) {
    return (
      <div className="randomGroupCreation">
        <StatusMessage message="Only teachers can create groups" type="error" />
      </div>
    );
  }

  return (
    <div className="randomGroupCreation">
      <div className="rgc-container">
        <h2>Random Group Creator</h2>

        {!showPreview ? (
          <>
            <div className="rgc-form">
              <div className="rgc-input-group">
                <label htmlFor="groupCount">Number of Groups (optional)</label>
                <Textbox
                  id="groupCount"
                  type="number"
                  placeholder="e.g., 4"
                  onInput={setGroupCount}
                  className="rgc-input"
                />
                <small>Distribute students evenly across this many groups</small>
              </div>

              <div className="rgc-input-group">
                <label htmlFor="membersPerGroup">Members Per Group (optional)</label>
                <Textbox
                  id="membersPerGroup"
                  type="number"
                  placeholder="e.g., 3"
                  onInput={setMembersPerGroup}
                  className="rgc-input"
                />
                <small>Create groups with this many members each</small>
              </div>

              <div className="rgc-input-group">
                <label htmlFor="groupNamePrefix">Group Name Prefix</label>
                <Textbox
                  id="groupNamePrefix"
                  type="text"
                  placeholder="e.g., Group, Team, Squad"
                  value={groupNamePrefix}
                  onInput={setGroupNamePrefix}
                  className="rgc-input"
                />
                <small>Groups will be named: {groupNamePrefix} 1, {groupNamePrefix} 2, etc.</small>
              </div>

              <div className="rgc-strategy">
                <strong>Strategy:</strong> {getStrategyDescription()}
              </div>

              {statusMessage && (
                <StatusMessage message={statusMessage} type={statusType} />
              )}

              <Button
                onClick={handleCreateGroups}
                disabled={isLoading}
                className="rgc-create-btn"
              >
                {isLoading ? "Creating Groups..." : "Create Groups"}
              </Button>
            </div>

            <div className="rgc-help">
              <h3>How It Works</h3>
              <ul>
                <li>
                  <strong>Groups Only:</strong> Distributes all students evenly. Leftover
                  students are randomly assigned.
                </li>
                <li>
                  <strong>Members Per Group:</strong> Creates complete groups. If remaining
                  students &gt; half group size, creates additional group. Otherwise, notifies
                  you.
                </li>
                <li>
                  <strong>Both:</strong> Creates exact specifications and notifies about
                  remaining students.
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <div className="rgc-preview">
              <h3>Preview - {createdCount} Groups Created</h3>

              {remainingStudents.length > 0 && (
                <div className="rgc-warning">
                  <h4>⚠️ Remaining Students ({remainingStudents.length})</h4>
                  <table className="rgc-remaining-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {remainingStudents.map((student) => (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                          <td>#{student.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="rgc-note">
                    These students could not be assigned. You can manually add them to groups
                    or adjust your parameters.
                  </p>
                </div>
              )}

              <div className="rgc-groups-preview">
                {previewGroups.map((group) => (
                  <div key={group.id} className="rgc-group-card">
                    <h4>{group.name}</h4>
                    <p className="rgc-member-count">{group.memberCount} members</p>
                    <ul className="rgc-members-list">
                      {group.members.map((member) => (
                        <li key={member.id}>
                          {member.name} <span className="rgc-email">({member.email})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="rgc-actions">
                <Button onClick={() => setShowPreview(false)} className="rgc-back-btn">
                  Back to Settings
                </Button>
                <Button
                  onClick={() => {
                    setGroupCount("");
                    setMembersPerGroup("");
                    setGroupNamePrefix("Group");
                    setShowPreview(false);
                    setPreviewGroups([]);
                    setRemainingStudents([]);
                    setStatusMessage("Groups created successfully! Create more groups or return to class.");
                    setStatusType("success");
                  }}
                  className="rgc-reset-btn"
                >
                  Create More Groups
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
