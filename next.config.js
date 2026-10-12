   const repo = "quran-learner";
   module.exports = {
     output: "export",
     images: { unoptimized: true },
     basePath: process.env.NODE_ENV === "production" ? `/${repo}` : "",
   };
