module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
        "wip",
      ],
    ],

    "header-max-length": [2, "always", 72],
    "subject-case": [0, "never"],
    "scope-enum": [
      2,
      "always",
      [
        "repo",
        "4md",
        "4focus",
        "web",
        "docs",
        "ui",
        "eslint-config",
        "typescript-config",
      ],
    ],
  },
};
