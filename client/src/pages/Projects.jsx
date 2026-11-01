import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { profs, projects } from "@/test/api";
import { ErrorMessage, Loading } from "@/components/Extras";
import Card from "@/components/Card";
import Popup from "@/components/Popup";

function ProjectDetail({ project }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading text-2xl">{project.pname}</h2>
        <p className="mt-2">{project.desc}</p>
      </div>

      <div>
        <p className="text-sm text-ink-soft">Maximum students</p>
        <p className="font-bold">{project.max_students}</p>
      </div>

      <Link
        to={`/projects?prof=${encodeURIComponent(project.prof_id)}`}
        className="inline-block text-sm font-bold underline hover:text-ink-soft"
      >
        View other projects by this professor
      </Link>
    </div>
  );
}

export default function Projects() {
  const [searchParams] = useSearchParams();
  const profId = searchParams.get("prof");

  const [projectList, setProjectList] = useState(null);
  const [prof, setProf] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        let list;
        let professor = null;

        if (profId) {
          [professor, list] = await Promise.all([
            profs.get(profId),
            projects.getByProf(profId),
          ]);
        } else {
          list = await projects.getAll();
        }

        if (active) {
          setProf(professor);
          setProjectList(list);
        }
      } catch (err) {
        if (active) setError(err.message || "Failed to load projects.");
      }
    }

    setProjectList(null);
    setProf(null);
    setError("");

    load();

    return () => {
      active = false;
    };
  }, [profId]);

  if (error) return <ErrorMessage message={error} />;
  if (!projectList) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading text-3xl">
          {prof ? `Projects by ${prof.name}` : "Projects"}
        </h2>

        <p className="mt-2 text-sm text-ink-soft">
          {prof
            ? `Showing projects supervised by ${prof.name}.`
            : "Browse all available projects."}
        </p>

        {prof && (
          <Link
            to="/projects"
            className="mt-3 inline-block text-sm font-bold underline hover:text-ink-soft"
          >
            View all projects
          </Link>
        )}
      </div>

      {projectList.length === 0 ? (
        <p className="text-sm text-ink-soft">No projects available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projectList.map((project) => (
            <Card
              key={project._id}
              onClick={() => setSelectedProject(project)}
              className="cursor-pointer space-y-2 hover:bg-butter"
            >
              <h3 className="heading text-xl">{project.pname}</h3>
              <p className="text-sm text-ink-soft line-clamp-3">
                {project.desc}
              </p>
              <p className="text-xs text-ink-soft">
                Maximum students: {project.max_students}
              </p>
            </Card>
          ))}
        </div>
      )}

      {selectedProject && (
        <Popup
          title={selectedProject.pname}
          onClose={() => setSelectedProject(null)}
        >
          <ProjectDetail project={selectedProject} />
        </Popup>
      )}
    </div>
  );
}
