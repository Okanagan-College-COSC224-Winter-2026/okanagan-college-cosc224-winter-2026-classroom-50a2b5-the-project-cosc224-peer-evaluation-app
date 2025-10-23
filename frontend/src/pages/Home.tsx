import { useEffect, useState } from "react";
import ClassCard from "../components/ClassCard";

import './Home.css'
import { listClasses } from "../util/api";
import { isTeacher } from "../util/login";

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    ;(async () => {
      const resp = await listClasses()
      setCourses(resp)
    })()
  }, [])

  return (
    <div className="Home">
      <h1>Peer Review Dashboard</h1>

      <div className="Classes">
        {
          courses.map((course) => {
            return (
              <ClassCard
                image="https://crc.losrios.edu//shared/img/social-1200-630/programs/general-science-social.jpg"
                name={course.name}
                subtitle={"A course"}
                onclick={() => {
                  //window.location.href = `/classes/${course.name, course.id}/home`
                  window.location.href = `/classes/${course.id}/home`
                }}
              />
            )
          })
        }

        { /* TODO only show when session is teacher */ }
        {isTeacher() && <div className="ClassCreateButton" onClick={() => window.location.href = '/classes/create'}>
          <h2>Create Class</h2>
        </div>}
      </div>
    </div>
  )
}