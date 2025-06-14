export const CriticalCSS = () => {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          /* Critical CSS for preventing FOUC */
          body {
            background-color: rgb(250 250 250);
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          /* Prevent layout shift */
          * {
            box-sizing: border-box;
          }
          
          /* Basic resets to prevent flash */
          h1, h2, h3, h4, h5, h6, p {
            margin: 0;
          }
          
          /* Ensure smooth font loading */
          .font-loading {
            visibility: hidden;
          }
          
          .font-loaded {
            visibility: visible;
          }
        `,
      }}
    />
  );
};