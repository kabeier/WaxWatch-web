type Project = {
  id: string;
  title: string;
  description: string;
  href?: string;
};

const PROJECTS: Project[] = [
  {
    id: "starter",
    title: "Starter Template",
    description: "This repo itself: Next.js + SWC + TS + Docker + CI + tests.",
  },
];

export default function ProjectsPage() {
  return (
    <section>
      <h1>Projects</h1>
      <ul>
        {PROJECTS.map((project) => (
          <li key={project.id} style={{ marginBottom: 12 }}>
            <strong>{project.title}</strong>
            <div>{project.description}</div>
            {project.href ? (
              <div>
                <a href={project.href} target="_blank" rel="noreferrer">
                  Link
                </a>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
