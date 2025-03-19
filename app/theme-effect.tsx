export function ThemeEffect() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            try {
              const preference = localStorage.getItem("theme") || "system";
              const isDark = 
                preference === "dark" || 
                (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                
              if (isDark) {
                document.documentElement.classList.add("dark");
              } else {
                document.documentElement.classList.remove("dark");
              }
            } catch (error) {
              console.error("Error applying theme:", error);
            }
          })();
        `,
      }}
    />
  );
}