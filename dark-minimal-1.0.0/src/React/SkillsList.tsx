import { useId, useState, type ReactNode } from "react";

// Shared wrapper so each icon below is just its paths.
const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="shrink-0 text-[var(--sec)]"
  >
    {children}
  </svg>
);

// The icon lives with its category, so the two can never drift out of sync.
const skills = [
  {
    title: "Full-Stack Development",
    icon: (
      <Icon>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="M6 8h.01" />
        <path d="M10 8h.01" />
        <path d="M14 8h.01" />
      </Icon>
    ),
    items: [
      "Full-stack web applications with Astro, React, and Supabase",
      "Database architecture, state management, and data persistence",
      "Production deployment, live maintenance, and technical SEO",
    ],
  },
  {
    title: "Frontend & UI Engineering",
    icon: (
      <Icon>
        <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
        <path d="M5 17A12 12 0 0 1 17 5" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
      </Icon>
    ),
    items: [
      "Responsive Single Page Applications (SPAs)",
      "Modern styling with TailwindCSS and dynamic components",
      "UI/UX prototyping and layout design using Figma",
    ],
  },
  {
    title: "Core Programming & Tools",
    icon: (
      <Icon>
        <path d="M12 19h8" />
        <path d="m4 17 6-6-6-6" />
      </Icon>
    ),
    items: [
      "Scripting logic and automation with Python and C++",
      "Version control and collaboration using Git and GitHub",
      "Performance optimization for fast-loading web apps",
    ],
  },
];

const SkillsList = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const baseId = useId();

  const toggleItem = (title: string) => {
    setOpenItem((current) => (current === title ? null : title));
  };

  return (
    <div className="text-left pt-3 md:pt-9">
      <h3 className="text-[var(--white)] text-3xl md:text-4xl font-semibold md:mb-6">
        What I do?
      </h3>
      <ul className="space-y-4 mt-4 text-lg">
        {skills.map(({ title, icon, items }, index) => {
          const isOpen = openItem === title;
          const panelId = `${baseId}-panel-${index}`;

          return (
            <li key={title} className="w-full">
              <div className="md:w-[400px] w-full bg-[#1414149c] rounded-2xl text-left hover:bg-opacity-80 transition-all border border-[var(--white-icon-tr)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleItem(title)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center gap-3 p-4 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--sec)]"
                >
                  {icon}
                  <span className="min-w-0 flex-grow truncate text-[var(--white)] text-lg">
                    {title}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className={`w-6 h-6 shrink-0 text-[var(--white)] transform transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" />
                  </svg>
                </button>

                <div
                  id={panelId}
                  aria-hidden={!isOpen}
                  className={`transition-all duration-300 motion-reduce:transition-none px-4 ${
                    isOpen
                      ? "max-h-[500px] pb-4 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="space-y-2 text-[var(--white-icon)] text-sm">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="pl-1" aria-hidden="true">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SkillsList;
