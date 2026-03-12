import { useEffect, useState, useCallback } from "react";
import { searchCourses } from "../util/api";
import "./CourseSearch.css";

export default function CourseSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const data = await searchCourses(q);
      setResults(data);
      setSearched(true);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all courses on mount (empty query = all in scope)
  useEffect(() => {
    doSearch("");
  }, [doSearch]);

  // Debounced live search as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="CourseSearch">
      <h1>Course Search</h1>

      <div className="SearchBar">
        <input
          type="text"
          className="SearchInput"
          placeholder="Search by course name (e.g. COSC Projects)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            className="ClearButton"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {loading && <p className="SearchStatus">Searching...</p>}

      {!loading && searched && results.length === 0 && (
        <div className="NoResults">
          <p>No courses found{query ? ` for "${query}"` : ""}.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="ResultCount">
            {results.length} course{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="SearchResults">
            {results.map((course) => (
              <div
                key={course.id}
                className="CourseResultCard"
                onClick={() => {
                  window.location.href = `/classes/${course.id}/home`;
                }}
              >
                <div className="CourseResultInfo">
                  <h2 className="CourseName">{course.name}</h2>
                  {course.teacher_name && (
                    <p className="TeacherName">
                      Instructor: {course.teacher_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
