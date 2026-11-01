import { useEffect, useState } from "react";
import { students } from "@/test/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";

export default function Students() {
  const [studentList, setStudentList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const list = await students.getAll();
        if (active) setStudentList(list);
      } catch (err) {
        if (active) setError(err.message || "Failed to load students.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!studentList) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">Students</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Browse students registered on the platform.
        </p>
      </div>

      {studentList.length === 0 ? (
        <p className="text-sm text-ink-soft">No students available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {studentList.map((student) => (
            <Card key={student._id} className="space-y-3">
              <div>
                <h3 className="heading text-xl">{student.name}</h3>
                <p className="text-sm text-ink-soft">{student.email}</p>
              </div>

              {student.about && <p className="text-sm">{student.about}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
