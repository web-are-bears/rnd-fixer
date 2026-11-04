import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";
import Button from "@/components/Button";
import { profs, projects, students, getPhase } from "@/api";

/*
 * PHASE 0 - prof should be able to see student list, their own projects,
 *    and also add/remove/modify projects. maybe we need a EdiTable component
 *    (pun intended)
 * PHASE 1 - prof should NOT be able to remove projects, only add them.
 * PHASE 2 - prof should be able to see a list of students who have given
 *    projects tokens. per project the prof would get 100 tokens so depending
 *    on the sum of token_dist in that project, they can assign tokens to
 *    students
 * PHASE 3 - prof should be able to navigate but they cannot modify their
 *    distribution in this phase
 * PHASE 4 - prof should be able to see final assignments. we could add a
 *    report/ticket system to admin later for this phase's "corrections" part
 */

function ProjectDetail({ project, studentList, phase }) {
  const relevantStudents = studentList
    .map((student) => ({
      ...student,
      tokens: Number(student.token_dist?.[project._id] || 0),
    }))
    .filter((student) => {
      if (phase == 4) return student.final_proj_id == project._id;
      if (phase >= 2) return student.tokens > 0;
      return student.final_proj_id == project._id;
    });

  const totalTokens = relevantStudents.reduce(
    (sum, student) => sum + student.tokens,
    0,
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading text-2xl">{project.pname}</h2>
        <p className="mt-2">{project.desc}</p>
        <p className="mt-2 text-sm text-ink-soft">
          Maximum students: {project.max_students}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="heading text-xl">
            {phase == 4
              ? "Final Assignments"
              : phase >= 2
                ? "Student Preferences"
                : "Assigned Students"}
          </h3>

          {phase >= 2 && phase < 4 && (
            <p className="text-sm text-ink-soft">
              {totalTokens} preference tokens
            </p>
          )}
        </div>

        {relevantStudents.length == 0 ? (
          <p className="text-sm text-ink-soft">
            No students found.
          </p>
        ) : (
          relevantStudents.map((student) => (
            <Card key={student._id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold">{student.name}</h4>
                  <p className="text-sm text-ink-soft">{student.uname}</p>
                  <p className="text-sm">{student.email}</p>
                </div>

                {phase >= 2 && phase < 4 && (
                  <strong>{student.tokens} tokens</strong>
                )}
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

export default function ProfDashboard({ uname }) {
  const [info, setInfo] = useState(null);
  const [phase, setPhase] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [prof, currentPhase] = await Promise.all([
          profs.get(uname),
          getPhase(),
        ]);

        const [allProjects, allStudents] = await Promise.all([
          projects.getByProf(prof._id),
          students.getAll(),
        ]);

        if (active) {
          setInfo(prof);
          setPhase(currentPhase);
          setProjectList(allProjects);
          setStudentList(allStudents);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load dashboard.");
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [uname]);

  if (error && !info) return <ErrorMessage message={error} />;
  if (!info || phase == null) return <Loading />;

  const getProjectStudents = (project) => {
    if (phase == 4) {
      return studentList.filter(
        (student) => student.final_proj_id == project._id,
      );
    }

    if (phase >= 2) {
      return studentList.filter(
        (student) => Number(student.token_dist?.[project._id] || 0) > 0,
      );
    }

    return studentList.filter(
      (student) => student.final_proj_id == project._id,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">{info.name}</h2>
        <p className="text-sm text-ink-soft">{info.email}</p>
        {info.about && <p className="mt-3">{info.about}</p>}
      </div>

      <div className="border-y-2 border-ink py-3">
        <h3 className="heading text-xl">
          PHASE {phase}: PHASE {phase}
        </h3>
      </div>

      {error && <ErrorMessage message={error} />}

      {phase == 0 && (
        <section className="space-y-3">
          <p>
            Student token distribution has not started yet. You can view your
            projects and their currently assigned students.
          </p>
          <Link className="btn" to="/projects">
            View Projects
          </Link>
        </section>
      )}

      {phase == 1 && (
        <section className="space-y-3">
          <p>
            Students are now distributing tokens among projects. You can
            continue managing your projects, but student preferences are not
            available yet.
          </p>
          <Link className="btn" to="/projects">
            View Projects
          </Link>
        </section>
      )}

      {phase == 2 && (
        <section className="space-y-3">
          <p>
            Student token distribution is complete. Review the students who
            selected your projects and the tokens they allocated.
          </p>
        </section>
      )}

      {phase == 3 && (
        <section className="space-y-3">
          <p>
            Student preferences are now read-only. You can continue reviewing
            the token distributions for your projects.
          </p>
        </section>
      )}

      {phase == 4 && (
        <section className="space-y-3">
          <p>
            Final assignments are available. Review the students assigned to
            each of your projects.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="heading text-xl">
          {phase == 4 ? "Final Assignments" : "Your Projects"}
        </h3>

        {projectList.length == 0 ? (
          <p className="text-sm text-ink-soft">
            You have no projects yet.
          </p>
        ) : (
          projectList.map((project) => {
            const count = getProjectStudents(project).length;

            return (
              <Card
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className="cursor-pointer hover:bg-butter"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold">{project.pname}</h4>
                    <p className="mt-1 text-sm text-ink-soft">
                      {phase == 4
                        ? `${count} assigned students`
                        : phase >= 2
                          ? `${count} interested students`
                          : `${count} assigned students`}
                    </p>
                  </div>

                  <Button variant="secondary">View</Button>
                </div>
              </Card>
            );
          })
        )}
      </section>

      {selectedProject && (
        <Popup
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail
            project={selectedProject}
            studentList={studentList}
            phase={phase}
          />
        </Popup>
      )}
    </div>
  );
}
