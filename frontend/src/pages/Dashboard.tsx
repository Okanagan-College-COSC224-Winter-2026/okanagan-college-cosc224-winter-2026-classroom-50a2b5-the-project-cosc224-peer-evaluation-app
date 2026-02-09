// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { maybeHandleExpire } from "../util/api";
import ClassCard from "../components/ClassCard";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

interface ClassData {
  id: number;
  name: string;
  image_url?: string;
  assignments: { id: number; name: string }[];
  students_count: number; // New field for number of students
  role: "teacher" | "student";
}

export default function Dashboard() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"teacher" | "student">("student");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const resp = await fetch("http://localhost:5000/dashboard/", {
          method: "GET",
          credentials: "include",
        });
        maybeHandleExpire(resp);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        setRole(json.role || "student");

        // Transform backend data to include students count
        const classData: ClassData[] = json.dashboard.map((c: any) => ({
          id: c.class_id,
          name: c.class_name,
          assignments: c.assignments || [],
          students_count: c.students?.length || 0, // <-- Number of students enrolled
          image_url: "/oc_logo.png",
          role: json.role || "student",
        }));

        setClasses(classData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="Dashboard">
      <h1>{role === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}</h1>
      <div className="DashboardGrid">
        {classes.map((c) => (
          <ClassCard
            key={c.id}
            image={c.image_url!}
            name={c.name}
            subtitle={`Assignments: ${c.assignments.length} | Students: ${c.students_count}`}
            onclick={() => navigate(`/classes/${c.id}/home`)}
          />
        ))}
      </div>
    </div>
  );
}
