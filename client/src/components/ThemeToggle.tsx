import { useState } from "react";

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState(
    document.documentElement.getAttribute("data-bs-theme") ?? "light",
  );

  function toggleTheme(event: React.MouseEvent<HTMLButtonElement>) {
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    const updateTheme = () => {
      document.documentElement.setAttribute("data-bs-theme", newTheme);
      setCurrentTheme(newTheme);
      try {
        localStorage.setItem("timeledger-theme", newTheme);
      } catch {
        // Theme switching still works when browser storage is unavailable.
      }
    };

    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      updateTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(updateTheme);

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              "circle(0px at " + x + "px " + y + "px)",
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 600,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
  }

  return (
    <button className="btn btn-secondary" onClick={toggleTheme}>
      {currentTheme === "dark" ? (
        <i className="bi bi-sun-fill"></i>
      ) : (
        <i className="bi bi-moon-fill"></i>
      )}
    </button>
  );
}
