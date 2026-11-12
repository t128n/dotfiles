# Template Notes

- Each project template is a Copier template: `templates/<name>/copier.yml` plus `templates/<name>/template/`.
- Keep `_subdirectory: template` so template metadata stays out of generated projects.
- Files ending in `.jinja` are rendered; everything else is copied verbatim.
- Keep `{{ _copier_conf.answers_file }}.jinja` in every template so `copier update` can work later.
- The global `new` task passes `--trust`, so `_tasks` run. Keep them small, non-interactive, and safe; they execute in the generated project.
- Never put credentials or machine-specific values in templates.
