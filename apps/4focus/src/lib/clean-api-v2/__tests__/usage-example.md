# getRawSchema Usage Example

This example demonstrates how to use the new `getRawSchema` functionality with React Hook Form and Zod.

## 1. Define Your API with Zod Schemas

```typescript
import { init, zodCheck } from "@clean-api-v2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

// Define your Zod schemas
const registrationSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Create your API
const api = init()<{
  register: {
    payload: z.infer<typeof registrationSchema>;
    dto: { id: string; username: string };
    error: { message: string };
  };
}>()({
  register: {
    resolver: async ({ payload }) => {
      // Your API call logic
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return response.json();
    },
    schemas: {
      payload: zodCheck(registrationSchema), // ← Raw schema attached here
    },
  },
});
```

## 2. Use in React Component

```typescript
export function RegistrationForm() {
  // Get raw Zod schema for client-side validation
  const rawSchemas = api.getRawSchema("register");
  const formSchema = rawSchemas.payload; // ← Original Zod schema

  // Use with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(formSchema), // ← Direct integration!
  });

  const onSubmit = async (data: z.infer<typeof registrationSchema>) => {
    try {
      // Optional: Server validation before API call
      const apiSchemas = api.getSchema("register");
      apiSchemas.payload(data); // Validates on server

      // Make API call
      const result = await api.call("register", { payload: data });
      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Username</label>
        <input {...register("username")} />
        {errors.username && <span>{errors.username.message}</span>}
      </div>

      <div>
        <label>Email</label>
        <input type="email" {...register("email")} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <label>Password</label>
        <input type="password" {...register("password")} />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <div>
        <label>Confirm Password</label>
        <input type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
```

## Key Benefits

✅ **Single Source of Truth**: Define schemas once, use everywhere  
✅ **Type Safety**: Full TypeScript support for forms and API  
✅ **Clean Integration**: Direct `zodResolver(rawSchema)` usage  
✅ **Server + Client**: Same schema validates on both sides  
✅ **No Duplication**: Raw schemas extracted automatically

## How It Works

1. **`zodCheck(schema)`** creates a validator with the raw Zod schema attached
2. **`api.getRawSchema("key")`** extracts the original schemas for client use
3. **`zodResolver(rawSchema)`** uses the schema directly with react-hook-form
4. **`api.getSchema("key")`** provides server validators independently

This pattern eliminates schema duplication and ensures consistency between client and server validation! 🚀
