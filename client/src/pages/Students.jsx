import { useEffect, useState } from "react";
import { students } from "@/test/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";

function StudentDetail({ student }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading text-2xl">{student.name}</h2>
        <p className="text-sm text-ink-soft">{student.email}</p>
      </div>

      {student.about && (
        <div>
          <p className="text-sm font-bold">About</p>
          <p className="mt-1">{student.about}</p>
        </div>
      )}

      {student.links && (
        <div>
          <p className="text-sm font-bold">Links</p>
          <div className="mt-1 flex flex-col gap-1">
            {Object.entries(student.links).map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline hover:text-ink-soft"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Students() {
  const [studentList, setStudentList] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
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
            <Card
              key={student._id}
              onClick={() => setSelectedStudent(student)}
              className="cursor-pointer space-y-3 hover:bg-butter"
            >
              <div>
                <h3 className="heading text-xl">{student.name}</h3>
                <p className="text-sm text-ink-soft">{student.email}</p>
              </div>

              {student.about && (
                <p className="text-sm line-clamp-3">{student.about}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedStudent && (
        <Popup
          title={selectedStudent.name}
          onClose={() => setSelectedStudent(null)}
        >
          <StudentDetail student={selectedStudent} />
        </Popup>
      )}
    </div>
  );
}
