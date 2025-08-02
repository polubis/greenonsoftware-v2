# Supabase guide

## How to create a new Supabase project?

1. Navigate to specific app
2. Run `npm install supabase --save-dev`
3. Run `npx supabase init`
4. It will generate you following folder

```md
greenonsoftware-v2/

- apps/
- documentation/
- packages/
- supabase/ <-- NOWO UTWORZONY FOLDER
  - config.toml
  - .gitignore
- package.json
- ...
```

5. Run the **Docker Desktop** and then run start command `npx supabase start`
6. It will produce following info in terminal

```md
Started Supabase local development setup.

        API URL: http://localhost:54321
        DB URL: postgresql://postgres:postgres@localhost:54322/postgres
        ...
```

## Development

1. To stop Supabase for specific app run `npx supabase stop --project-id [app-name]`
2. To run Supabase use `npx supabase start` and go to `http://localhost:54323/project/default`. Remember about port per app. You can use either `--project-id [app-name] flag
3. You can create migration file via command `npx supabase migrations new create_tasks_table`
4. To apply new migration

- Run `npx supabase db reset` - it clears all data and applies migrations (ONLY FOR DEVELOPMENT)
- For production usage run `npx supabase migration up`.
