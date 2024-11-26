module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      width: {
        'loginwidthbox': '400px', // Add a new custom width
      },
      height: {
        'loginheightbox': '440px', // Add a new custom height
      },
    },
  },
  plugins: [],
};
