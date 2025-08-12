**You are a world-class expert in Supabase and PostgreSQL, with a deep understanding of database architecture, performance optimization, and security best practices.**

I need your help to conduct a comprehensive audit of my Supabase project's database schema and migration files. Your primary goal is to identify potential problems, categorize them by severity, and suggest actionable improvements. Focus on genuine issues that could impact performance, security, data integrity, and maintainability, rather than subjective preferences.

**Please analyze the provided schema and migration files, and produce a report that covers the following areas:**

---

### **1. Schema Analysis**

**a. Table and Column Design:**

- **Data Type Mismatches:** Are there any columns using inappropriate data types (e.g., using `text` for what should be a structured `jsonb` or a more specific numeric type)?
- **Improper Use of `json` vs. `jsonb`:** Are `json` columns being used where `jsonb` would be more appropriate for querying and indexing?
- **Normalization and Denormalization:** Is the schema appropriately normalized to reduce data redundancy? Conversely, are there areas where denormalization might be beneficial for performance, and if so, is it implemented correctly?
- **Primary Keys:** Does every table have a suitable primary key? Are composite primary keys used where appropriate, or are auto-incrementing keys overused on linking tables?
- **Indexing Strategy:**
  - Are there missing indexes on frequently queried columns, especially foreign keys?
  - Are there unused or redundant indexes that add overhead to write operations?
  - Are there duplicate indexes that offer no benefit?
- **Naming Conventions:** Are table and column names consistent? While this can be a preference, highlight inconsistencies that could lead to confusion or errors (e.g., mixing `snake_case` and `camelCase`).
- **Use of Schemas:** Are custom schemas being used effectively to organize the database, or is everything in the `public` schema by default?

**b. Relationships and Constraints:**

- **Foreign Key Constraints:** Are foreign key relationships properly defined to ensure referential integrity?
- **Cascading Deletes:** Is the use of cascading deletes appropriate and correctly implemented where needed?
- **Constraints:** Are `CHECK` constraints and other data validation rules used effectively to maintain data integrity at the database level?

**c. Anti-Patterns:**

- **Soft Deletes:** Is there evidence of "soft deletes" (e.g., an `is_deleted` column)? If so, explain the potential drawbacks for referential integrity and query complexity.
- **Entity-Attribute-Value (EAV) Model:** Are there tables structured in an EAV pattern, and if so, what are the performance and data integrity implications?

---

### **2. Migration Analysis**

- **Migration Strategy:** Is there a clear and consistent migration strategy? Are migrations being generated declaratively using `supabase db diff` or written manually?
- **Reversibility:** While not always straightforward, could any of the migrations cause breaking changes that are difficult to revert?
- **Migration File Content:**
  - Are the migration files idempotent (i.e., can they be run multiple times without causing errors)?
  - Do the migrations include any potentially long-running operations that could lock tables and cause downtime during deployment?
  - Is there a mix of schema changes and data migrations in the same file? It's often better to separate them.

---

### **3. Performance and Optimization**

- **Query Performance:** Based on the schema, are there any obvious query performance bottlenecks? This might involve identifying areas that would necessitate slow queries.
- **Use of `explain()`:** Recommend the use of `explain()` to analyze the query plans for potentially slow queries you identify.
- **CPU and I/O Usage:** Are there schema design choices that could lead to high CPU usage or excessive disk I/O?

---

### **4. Security**

- **Row-Level Security (RLS):**
  - Are RLS policies enabled on all tables that store sensitive data?
  - Are there any tables with RLS enabled but no defined policies?
  - Are the RLS policies themselves efficient? For example, are they avoiding calling functions like `auth.uid()` for every row in a query?
- **Exposure of Sensitive Schemas:** Is the `auth.users` table or other sensitive schemas inadvertently exposed?
- **Function Security:** Are database functions defined with the appropriate security context (`security_invoker` or `security_definer`)?

---

### **5. Auditing and Logging**

- **Audit Trails:** Does the schema include a mechanism for auditing changes to critical data? If not, suggest a robust approach, potentially using triggers or extensions like `supa_audit`.

---

### **Output Format**

For each problem you identify, please present it in the following format:

- **Problem:** A clear and concise description of the issue.
- **Severity:** (Small, Medium, Big, Critical)
- **Analysis:** A detailed explanation of why this is a problem and the potential impact.
- **Suggested Improvement:** Actionable steps to resolve the issue. Provide code examples where appropriate.

**Please provide the final report in a well-structured and easy-to-read format.**

Here is my migration file & db schema:
